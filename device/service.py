"""
Main Daemon Service for Tingley Beach Camera Sentinel
Runs on Raspberry Pi 4 (Raspberry Pi OS 64-bit Headless)
Coordinates PIR motion interrupts, hourly scheduled captures,
CPU-based edge inference, GPIO servos & LEDs, cloud dashboard sync,
and bidirectional command polling for real-time actuator control.
"""

import hmac
import time
import sys
import os
import base64
import requests
import logging
import threading
from threading import Thread, Lock, Timer
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

from config import (
    DEVICE_ID,
    LOCATION_NAME,
    ZONE_NAME,
    DASHBOARD_API_URL,
    API_KEY,
    HEARTBEAT_INTERVAL_SECONDS
)
from gpio_controller import HardwareGPIOController
from camera import CameraController
from inference import EdgeInferenceEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("TingleyDaemon")

# Shared cloud command queue URL (instant sync between web admin and Pi)
COMMAND_QUEUE_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1f6f5bf537d79"


class LocalCommandHandler(BaseHTTPRequestHandler):
    """Lightweight local HTTP handler on port 8080 for LAN control / zero latency."""
    daemon_instance = None

    def log_message(self, format, *args):
        pass  # Quiet logging

    def _is_authorized(self):
        if not API_KEY:
            return False
        provided = self.headers.get("x-api-key", "")
        return bool(provided) and hmac.compare_digest(provided, API_KEY)

    def _reject_unauthorized(self):
        self.send_response(401)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"error": "Unauthorized"}')

    def do_GET(self):
        if not self._is_authorized():
            self._reject_unauthorized()
            return
        if self.path == "/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            status = {
                "device": DEVICE_ID,
                "servos": self.daemon_instance.gpio.current_servo_angle,
                "leds": self.daemon_instance.gpio.current_led_state,
                "online": True
            }
            self.wfile.write(json.dumps(status).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if not self._is_authorized():
            self._reject_unauthorized()
            return
        if self.path == "/reset":
            self.daemon_instance.gpio.reset_to_idle()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"success": true, "state": "idle_0_deg"}')
        elif self.path == "/deploy":
            self.daemon_instance.gpio.trigger_incident_actuation()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"success": true, "state": "alert_180_deg"}')
        else:
            self.send_response(404)
            self.end_headers()


class TingleyBeachSentinelDaemon:
    def __init__(self):
        logger.info("==================================================")
        logger.info("Initializing Tingley Beach Camera Sentinel Service")
        logger.info(f"Device: {DEVICE_ID} | Zone: {ZONE_NAME}")
        logger.info("==================================================")

        self.lock = Lock()
        self.camera = CameraController()
        self.inference = EdgeInferenceEngine()
        self.gpio = HardwareGPIOController()
        self.gpio.on_motion_callback = self.handle_motion_event
        self.running = True
        self.last_command_timestamp = time.time() * 1000
        self.reset_timer = None

        # Start background cloud command poller thread
        self.poller_thread = Thread(target=self._poll_cloud_commands, daemon=True)
        self.poller_thread.start()

        # Start local LAN server thread on port 8080
        LocalCommandHandler.daemon_instance = self
        self.local_server_thread = Thread(target=self._run_local_server, daemon=True)
        self.local_server_thread.start()

    def _run_local_server(self):
        """Runs local HTTP server on port 8080."""
        try:
            server = HTTPServer(("0.0.0.0", 8080), LocalCommandHandler)
            logger.info("Local HTTP control server active on port 8080 (http://tingley-cam.local:8080)")
            server.serve_forever()
        except Exception as e:
            logger.warning(f"Local server error: {e}")

    def handle_motion_event(self):
        """Called immediately upon PIR motion sensor interrupt."""
        Thread(target=self._process_event, args=("pir_motion",)).start()

    def handle_hourly_timer(self):
        """Called periodically every hour by the scheduled timer loop."""
        logger.info("Hourly timer tick: Executing baseline environmental check.")
        self._process_event(trigger_type="hourly_timer")

    def _auto_reset(self):
        """Automatically returns servos to 0° and LEDs to Green after alert display window."""
        logger.info("Auto-reset timer expired: Returning actuators to 0° (Green Idle)")
        self.gpio.reset_to_idle()

    def _process_event(self, trigger_type="pir_motion"):
        """Thread-safe capture, inference, actuation, and cloud dispatch."""
        if not self.lock.acquire(blocking=False):
            logger.info("Event currently in progress, skipping concurrent trigger.")
            return

        try:
            logger.info(f"Processing event trigger: {trigger_type.upper()}")

            # 1. Update Traffic LEDs to Yellow (Processing / Capturing)
            self.gpio.set_leds(green=False, yellow=True, red=False)

            # 2. Capture Frame via MIPI-CSI Camera Module
            frame_path = self.camera.capture_frame(prefix=trigger_type)

            # 3. Run Edge Inference on Pi 4 CPU
            result = self.inference.analyze_image(frame_path, trigger_type=trigger_type)

            # 4. Physical Actuation based on Detection
            if result["detected"]:
                logger.warning(f"🚨 INCIDENT FLAGGED: {result['type']} ({result.get('species')})")
                # Rotate both micro servos 180° and illuminate Red Traffic Light LEDs
                self.gpio.trigger_incident_actuation()

                # Cancel any pending reset timer and schedule fresh 15s auto-reset
                if self.reset_timer and self.reset_timer.is_alive():
                    self.reset_timer.cancel()
                self.reset_timer = Timer(15.0, self._auto_reset)
                self.reset_timer.daemon = True
                self.reset_timer.start()
                logger.info("Alert flag deployed. Scheduled 15s auto-reset.")
            else:
                logger.info("No incident detected. Baseline status nominal.")
                # Return LEDs to Green and servos to 0°
                self.gpio.reset_to_idle()

            # 5. Dispatch Event Payload to Vercel Dashboard API
            self._sync_to_cloud(frame_path, result, trigger_type)

        except Exception as e:
            logger.error(f"Error during event processing: {e}", exc_info=True)
            self.gpio.set_leds(green=False, yellow=False, red=True)
        finally:
            self.lock.release()

    def _sync_to_cloud(self, frame_path, result, trigger_type):
        """Pushes incident metadata and image to the cloud Next.js dashboard on Vercel."""
        try:
            # Read image and convert to base64 data URI if under 3MB
            image_payload = ""
            if os.path.exists(frame_path) and os.path.getsize(frame_path) < 3 * 1024 * 1024:
                with open(frame_path, "rb") as f:
                    b64_data = base64.b64encode(f.read()).decode("utf-8")
                    image_payload = f"data:image/jpeg;base64,{b64_data}"

            payload = {
                "apiKey": API_KEY,
                "deviceId": DEVICE_ID,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "trigger": trigger_type,
                "type": result["type"],
                "title": f"{result['type'].replace('_', ' ').title()}: {result.get('species') or 'Activity'}",
                "description": result["summary"],
                "species": result.get("species"),
                "confidence": result["confidence"],
                "location": f"{LOCATION_NAME} ({ZONE_NAME})",
                "pondZone": "central_pond",
                "imageBase64": image_payload,
                "boundingBoxes": result.get("bounding_boxes", []),
                "servosTriggered": result["detected"],
                "servoAngle": 180 if result["detected"] else 0,
                "sendEmail": result["detected"],
            }

            headers = {
                "Content-Type": "application/json",
                "x-api-key": API_KEY
            }

            logger.info(f"Syncing event to cloud dashboard: {DASHBOARD_API_URL}")
            resp = requests.post(DASHBOARD_API_URL, json=payload, headers=headers, timeout=12)
            if resp.status_code in (200, 201):
                logger.info("Successfully pushed incident to cloud dashboard!")
            else:
                logger.warning(f"Cloud dashboard responded with HTTP {resp.status_code}: {resp.text}")

        except Exception as e:
            logger.warning(f"Unable to reach cloud dashboard ({e}). Event saved locally on SD card.")

    def _poll_cloud_commands(self):
        """Continuously polls the cloud queue for actuator commands dispatched from Admin panel."""
        logger.info("Cloud command poller active. Listening for dashboard actuator commands...")
        while self.running:
            try:
                resp = requests.get(COMMAND_QUEUE_URL, timeout=4)
                if resp.status_code == 200:
                    payload = resp.json()
                    data = payload.get("data", {})
                    cmd_ts = data.get("timestamp", 0)

                    if cmd_ts > self.last_command_timestamp:
                        self.last_command_timestamp = cmd_ts
                        command = data.get("command")
                        logger.warning(f"⚡ RECEIVED CLOUD ACTUATOR COMMAND: {command}")

                        if command == "reset_servos":
                            if self.reset_timer and self.reset_timer.is_alive():
                                self.reset_timer.cancel()
                            self.gpio.reset_to_idle()
                        elif command == "deploy_servos":
                            self.gpio.trigger_incident_actuation()
                        elif command == "set_leds":
                            led_color = data.get("ledColor", "green")
                            self.gpio.set_leds(
                                green=(led_color == "green"),
                                yellow=(led_color == "yellow"),
                                red=(led_color == "red")
                            )
                        elif command == "capture_now":
                            Thread(target=self._process_event, args=("manual_admin",)).start()

            except Exception as e:
                logger.debug(f"Cloud command poll error: {e}")

            time.sleep(1.2)

    def run(self):
        """Main service loop with hourly scheduled timer heartbeat."""
        logger.info("Tingley Sentinel Daemon is LIVE. Listening for PIR interrupts and hourly ticks...")
        last_hourly_check = time.time()

        try:
            while self.running:
                now = time.time()
                # Check hourly interval
                if now - last_hourly_check >= HEARTBEAT_INTERVAL_SECONDS:
                    last_hourly_check = now
                    self.handle_hourly_timer()

                time.sleep(1.0)
        except KeyboardInterrupt:
            logger.info("Stopping daemon service...")
        finally:
            self.running = False
            self.gpio.cleanup()
            logger.info("Shutdown complete.")


if __name__ == "__main__":
    daemon = TingleyBeachSentinelDaemon()
    daemon.run()
