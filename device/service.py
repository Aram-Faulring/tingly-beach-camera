"""
Main Daemon Service for Tingley Beach Camera Sentinel
Runs on Raspberry Pi 4 (Raspberry Pi OS 64-bit Headless)
Coordinates PIR motion interrupts, hourly scheduled captures,
CPU-based edge inference, GPIO servos & LEDs, and cloud dashboard sync.
"""

import time
import sys
import os
import base64
import requests
import logging
from threading import Thread, Lock

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

    def handle_motion_event(self):
        """Called immediately upon PIR motion sensor interrupt."""
        Thread(target=self._process_event, args=("pir_motion",)).start()

    def handle_hourly_timer(self):
        """Called periodically every hour by the scheduled timer loop."""
        logger.info("Hourly timer tick: Executing baseline environmental check.")
        self._process_event(trigger_type="hourly_timer")

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
            self.gpio.cleanup()
            logger.info("Shutdown complete.")


if __name__ == "__main__":
    daemon = TingleyBeachSentinelDaemon()
    daemon.run()
