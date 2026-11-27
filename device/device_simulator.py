#!/usr/bin/env python3
"""
Tingley Beach Sentinel — Hardware Device Simulator (macOS & Local Environments)
Simulates the full Raspberry Pi 4 Model B edge unit without physical hardware:
- Virtual SG90 micro servos (0° rest to 180° alert deployment)
- Virtual dual traffic light LED modules (Green/Yellow/Red)
- Virtual Fresnel lens PIR motion sensor with timed interrupts
- Simulated YOLOv8 edge inference classifier for Tingley Beach wildlife & violations
- Cloud synchronization with Vercel Next.js dashboard
- Real-time polling of cloud command queue (bidirectional actuator control)
- Local HTTP REST server on port 8080 (zero-latency browser control & status)
"""

import sys
import os
import time
import json
import base64
import urllib.parse
import threading
from threading import Thread, Lock, Timer
from http.server import HTTPServer, BaseHTTPRequestHandler
import requests

# Cloud & Local Configuration
VERCEL_DASHBOARD_URL = os.getenv("DASHBOARD_URL", "https://tingly-beach-camera-nj21.vercel.app")
LOCAL_DASHBOARD_URL = "http://localhost:3000"
COMMAND_QUEUE_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1f6f5bf537d79"
DEVICE_API_KEY = os.getenv("DEVICE_API_KEY", "")
DEVICE_ID = "tingley-mac-simulator"
DEVICE_NAME = "Tingley Beach Sentinel Pi 4 (Mac Simulator)"
LOCATION_NAME = "Tingley Beach - Albuquerque, NM"
PORT = 8080

# ANSI Colors for terminal output
C_RESET = "\033[0m"
C_BOLD = "\033[1m"
C_GREEN = "\033[32m"
C_YELLOW = "\033[33m"
C_RED = "\033[31m"
C_CYAN = "\033[36m"
C_MAGENTA = "\033[35m"
C_BLUE = "\033[34m"

# High-fidelity SVG captures matching the dashboard
SVGS = {
    "dead_duck": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7da5be"/><stop offset="100%" stop-color="#dce7ea"/></linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2a4858"/><stop offset="100%" stop-color="#142834"/></linearGradient>
  </defs>
  <rect width="1200" height="400" fill="url(#sky)"/><rect y="400" width="1200" height="400" fill="url(#water)"/>
  <polygon points="0,400 200,360 450,390 700,340 950,380 1200,360 1200,400" fill="#2d3b2a"/>
  <g transform="translate(540, 500) scale(1.1)">
    <ellipse cx="60" cy="50" rx="90" ry="18" fill="#1b2a33" opacity="0.7"/>
    <ellipse cx="60" cy="40" rx="65" ry="32" fill="#544332"/>
    <path d="M15,40 Q0,50 -15,62 Q-20,75 -8,78 Q5,75 10,52 Z" fill="#184a32"/>
    <path d="M-15,68 L-30,76 L-18,80 Z" fill="#d99b26"/>
  </g>
  <rect x="480" y="460" width="260" height="160" fill="red" fill-opacity="0.15" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4"/>
  <rect x="480" y="430" width="230" height="30" fill="#ef4444"/>
  <text x="490" y="452" font-family="sans-serif" font-weight="bold" font-size="14" fill="#ffffff">DEAD DUCK: MALLARD (94.2%)</text>
  <rect x="20" y="20" width="360" height="42" fill="#000000" fill-opacity="0.75" rx="6"/>
  <text x="35" y="46" font-family="monospace" font-size="14" fill="#10b981">● SIM [MAC-PI4-CAM] 1080P 30FPS</text>
</svg>""",
    "dead_goose": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <rect width="1200" height="450" fill="#94a3b8"/><rect y="450" width="1200" height="350" fill="#334155"/>
  <g transform="translate(500, 420)">
    <ellipse cx="100" cy="80" rx="110" ry="24" fill="#1e293b" opacity="0.7"/>
    <ellipse cx="100" cy="65" rx="80" ry="40" fill="#64748b"/>
    <path d="M30,65 Q-20,65 -50,90 Q-60,110 -30,110 Q-10,95 25,75 Z" fill="#0f172a"/>
  </g>
  <rect x="420" y="380" width="300" height="180" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4"/>
  <rect x="420" y="350" width="280" height="30" fill="#ef4444"/>
  <text x="430" y="371" font-family="sans-serif" font-weight="bold" font-size="13" fill="#ffffff">DEAD BIRD: CANADA GOOSE (91.5%)</text>
  <rect x="20" y="20" width="360" height="42" fill="#000000" fill-opacity="0.75" rx="6"/>
  <text x="35" y="46" font-family="monospace" font-size="14" fill="#f59e0b">● MOTION INTERRUPT: ZONE 3</text>
</svg>""",
    "illegal_fishing": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <rect width="1200" height="450" fill="#0e171f"/><rect y="450" width="1200" height="350" fill="#080c10"/>
  <circle cx="950" cy="420" r="18" fill="#ffdd80" opacity="0.6"/>
  <g transform="translate(620, 360)">
    <circle cx="80" cy="70" r="14" fill="#0f172a"/>
    <path d="M65,85 L95,85 L102,150 L58,150 Z" fill="#1e293b"/>
    <line x1="50" y1="120" x2="-140" y2="40" stroke="#94a3b8" stroke-width="3"/>
  </g>
  <rect x="670" y="415" width="85" height="225" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="2.5"/>
  <rect x="670" y="390" width="140" height="25" fill="#f59e0b"/>
  <text x="678" y="407" font-family="sans-serif" font-weight="bold" font-size="12" fill="#000000">SUSPECT (91.4%)</text>
  <rect x="460" y="390" width="220" height="120" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="5,4"/>
  <rect x="460" y="365" width="210" height="25" fill="#ef4444"/>
  <text x="468" y="382" font-family="sans-serif" font-weight="bold" font-size="12" fill="#ffffff">FISHING ROD DETECTED (88.7%)</text>
</svg>""",
    "dead_fish": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <rect width="1200" height="800" fill="#2d3732"/>
  <ellipse cx="600" cy="400" rx="380" ry="220" fill="#4d6156"/>
  <g transform="translate(480, 360)">
    <path d="M10,70 Q70,20 180,35 Q230,45 250,70 Q210,95 140,95 Q50,95 10,70 Z" fill="#e2e8f0"/>
    <path d="M40,68 Q120,55 210,65" stroke="#f43f5e" stroke-width="12" stroke-linecap="round" opacity="0.7"/>
  </g>
  <rect x="460" y="330" width="320" height="160" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4"/>
  <rect x="460" y="300" width="280" height="30" fill="#ef4444"/>
  <text x="470" y="321" font-family="sans-serif" font-weight="bold" font-size="13" fill="#ffffff">DEAD FISH: RAINBOW TROUT (96.8%)</text>
</svg>""",
    "routine_day": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <rect width="1200" height="380" fill="#38bdf8"/>
  <circle cx="1050" cy="120" r="50" fill="#fde047" opacity="0.85"/>
  <rect y="380" width="1200" height="420" fill="#0284c7"/>
  <rect x="440" y="700" width="320" height="44" fill="#059669" rx="8"/>
  <text x="470" y="728" font-family="sans-serif" font-weight="bold" font-size="16" fill="#ffffff">✓ HOURLY BASELINE: ALL CLEAR</text>
  <rect x="20" y="20" width="350" height="42" fill="#000000" fill-opacity="0.65" rx="6"/>
  <text x="35" y="46" font-family="monospace" font-size="14" fill="#10b981">● TIMED HEARTBEAT (NOMINAL)</text>
</svg>"""
}

def to_data_uri(svg_string: str) -> str:
    encoded = urllib.parse.quote(svg_string.strip())
    return f"data:image/svg+xml;utf8,{encoded}"


class SimulatorHTTPHandler(BaseHTTPRequestHandler):
    """Local HTTP endpoint on port 8080 supporting live browser communication."""
    simulator = None

    def log_message(self, format, *args):
        pass  # Suppress default noisy request logs

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, x-api-key")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path in ("/status", "/api/status", "/"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            status = self.simulator.get_status_dict()
            self.wfile.write(json.dumps(status).encode("utf-8"))
        elif self.path == "/ping":
            self.send_response(200)
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b"pong")
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = {}
        if content_length > 0:
            try:
                body = json.loads(self.rfile.read(content_length).decode("utf-8"))
            except Exception:
                pass

        if self.path == "/reset":
            self.simulator.reset_to_idle()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"success": true, "state": "idle_0_deg"}')

        elif self.path == "/deploy":
            self.simulator.deploy_servos_alert()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"success": true, "state": "alert_180_deg"}')

        elif self.path == "/trigger":
            scenario = body.get("scenario", "dead_duck")
            incident = self.simulator.trigger_scenario(scenario)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "incident": incident}).encode("utf-8"))

        elif self.path == "/leds":
            color = body.get("ledColor", "green")
            self.simulator.set_leds(
                green=(color == "green"),
                yellow=(color == "yellow"),
                red=(color == "red")
            )
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "ledColor": color}).encode("utf-8"))

        elif self.path == "/pir":
            self.simulator.pulse_pir_motion()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"success": true, "motion": "pulsed_3s"}')

        elif self.path == "/auto":
            enabled = body.get("enabled", not self.simulator.auto_simulate)
            self.simulator.auto_simulate = enabled
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "autoSimulate": enabled}).encode("utf-8"))

        else:
            self.send_response(404)
            self.end_headers()


class TingleyDeviceSimulator:
    def __init__(self):
        self.lock = Lock()
        self.running = True
        self.start_time = time.time()

        # Actuator and Sensor State
        self.servo_angles = [0, 0]
        self.led_state = {"green": True, "yellow": False, "red": False}
        self.pir_status = "idle"
        self.camera_status = "ready"
        self.cpu_temp = 46.5
        self.cpu_usage = 20
        self.voltage = 5.12
        self.memory_mb = 1180

        # Command Queue Tracking
        self.last_command_ts = time.time() * 1000
        self.reset_timer = None
        self.auto_simulate = False
        self.auto_scenario_idx = 0

    def get_status_dict(self):
        uptime_hours = round((time.time() - self.start_time) / 3600.0, 2)
        return {
            "device": DEVICE_ID,
            "name": DEVICE_NAME,
            "online": True,
            "isSimulator": True,
            "simulatorOnline": True,
            "platform": "macOS (Apple Silicon/Intel)",
            "uptimeHours": uptime_hours,
            "servos": self.servo_angles,
            "servoAngle": self.servo_angles[0],
            "leds": self.led_state,
            "ledState": self.led_state,
            "pirSensor": self.pir_status,
            "pirSensorStatus": self.pir_status,
            "cameraStatus": self.camera_status,
            "cpuTempC": self.cpu_temp,
            "cpuUsagePct": self.cpu_usage,
            "memoryUsageMb": self.memory_mb,
            "voltageV": self.voltage,
            "lastHeartbeat": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "autoSimulate": self.auto_simulate
        }

    def print_banner(self):
        print(f"\n{C_CYAN}{C_BOLD}========================================================================{C_RESET}")
        print(f"{C_CYAN}{C_BOLD}     TINGLEY BEACH SENTINEL — HARDWARE DEVICE SIMULATOR (macOS){C_RESET}")
        print(f"{C_CYAN}{C_BOLD}========================================================================{C_RESET}")
        print(f" {C_GREEN}● LOCAL DAEMON:{C_RESET} http://localhost:{PORT} (REST & CORS Active)")
        print(f" {C_GREEN}● CLOUD QUEUE:{C_RESET}  Polling every 1.2s for dashboard actuator commands")
        print(f" {C_GREEN}● CLOUD TARGET:{C_RESET} {VERCEL_DASHBOARD_URL}")
        print(f"{C_CYAN}------------------------------------------------------------------------{C_RESET}")
        self.print_state()
        print(f"{C_CYAN}------------------------------------------------------------------------{C_RESET}")
        print(f"{C_BOLD}Hotkeys: [1] Dead Duck  [2] Dead Goose  [3] Illegal Fishing  [4] Dead Trout{C_RESET}")
        print(f"{C_BOLD}         [5] Routine    [m] PIR Pulse   [d] Deploy 180°      [r] Reset 0°{C_RESET}")
        print(f"{C_BOLD}         [g/y/e] Green/Yellow/Red LEDs  [a] Auto-Simulate    [q] Quit{C_RESET}")
        print(f"{C_CYAN}========================================================================{C_RESET}\n")

    def print_state(self):
        angle = self.servo_angles[0]
        servos_vis = f"{C_RED}[ 180° ALERT DEPLOYED ]{C_RESET}" if angle >= 90 else f"{C_GREEN}[ 0° REST / IDLE ]{C_RESET}"
        
        g = f"{C_GREEN}● G{C_RESET}" if self.led_state["green"] else "○ G"
        y = f"{C_YELLOW}● Y{C_RESET}" if self.led_state["yellow"] else "○ Y"
        r = f"{C_RED}● R{C_RESET}" if self.led_state["red"] else "○ R"
        leds_vis = f"[{g} {y} {r}]"

        pir_vis = f"{C_YELLOW}TRIGGERED (HIGH){C_RESET}" if self.pir_status == "triggered" else f"{C_GREEN}IDLE (LOW){C_RESET}"

        print(f" {C_BOLD}Hardware Status:{C_RESET} Servos: {servos_vis}  LEDs: {leds_vis}  PIR: {pir_vis}")

    def reset_to_idle(self):
        with self.lock:
            if self.reset_timer and self.reset_timer.is_alive():
                self.reset_timer.cancel()
            self.servo_angles = [0, 0]
            self.led_state = {"green": True, "yellow": False, "red": False}
            self.pir_status = "idle"
            print(f"{C_GREEN}✓ Virtual Servos RESET to 0° | LEDs set to GREEN (Nominal Idle){C_RESET}")
        self.sync_telemetry_cloud()

    def deploy_servos_alert(self):
        with self.lock:
            self.servo_angles = [180, 180]
            self.led_state = {"green": False, "yellow": False, "red": True}
            print(f"{C_RED}🚨 Virtual Servos DEPLOYED to 180° | LEDs set to RED (Alert Active){C_RESET}")
            # Start 15s auto-reset
            if self.reset_timer and self.reset_timer.is_alive():
                self.reset_timer.cancel()
            self.reset_timer = Timer(15.0, self._auto_reset_callback)
            self.reset_timer.daemon = True
            self.reset_timer.start()
            print(f"{C_YELLOW}⏱  15-Second Auto-Reset Timer started.{C_RESET}")
        self.sync_telemetry_cloud()

    def _auto_reset_callback(self):
        print(f"\n{C_BLUE}ℹ Auto-reset timer expired: Returning hardware to 0° (Green Idle){C_RESET}")
        self.reset_to_idle()

    def set_leds(self, green=True, yellow=False, red=False):
        with self.lock:
            self.led_state = {"green": green, "yellow": yellow, "red": red}
            color_name = "GREEN" if green else "YELLOW" if yellow else "RED"
            print(f"{C_CYAN}Traffic Light Modules switched to {color_name}{C_RESET}")
        self.sync_telemetry_cloud()

    def pulse_pir_motion(self):
        def _pulse():
            with self.lock:
                self.pir_status = "triggered"
                print(f"{C_YELLOW}📡 [PIR SENSOR] Motion Interrupt Triggered (GPIO 17 High){C_RESET}")
            self.sync_telemetry_cloud()
            time.sleep(3.0)
            with self.lock:
                self.pir_status = "idle"
                print(f"{C_GREEN}📡 [PIR SENSOR] Motion cleared. Back to IDLE.{C_RESET}")
            self.sync_telemetry_cloud()

        Thread(target=_pulse, daemon=True).start()

    def trigger_scenario(self, scenario_key: str):
        """Simulates full capture, inference, actuation, and cloud incident dispatch."""
        logger_name = f"TRIGGER [{scenario_key.upper()}]"
        print(f"\n{C_BOLD}▶ {logger_name} Processing Edge Event...{C_RESET}")

        # 1. Turn LEDs to Yellow (Processing)
        self.set_leds(green=False, yellow=True, red=False)
        time.sleep(0.4)

        # 2. Build Scenario Definition
        scenarios = {
            "dead_duck": {
                "type": "dead_wildlife",
                "severity": "critical",
                "title": "Deceased Waterfowl Detected: Mallard Duck",
                "description": "PIR motion sensor triggered frame capture. YOLO edge inference flagged motionless deceased adult male Mallard duck floating near the eastern reeds of Central Pond.",
                "species": "Mallard Duck (Anas platyrhynchos)",
                "confidence": 0.942,
                "pondZone": "central_pond",
                "location": "Tingley Beach - Central Pond (East Bank Reeds)",
                "boxes": [{"label": "Dead Mallard Duck", "confidence": 0.942, "box": [57, 40, 77, 61]}],
                "servos": True,
            },
            "dead_goose": {
                "type": "dead_wildlife",
                "severity": "critical",
                "title": "Deceased Waterfowl Detected: Canada Goose",
                "description": "PIR motion sensor interrupt fired as wind moved surrounding reeds. Edge YOLO model identified motionless deceased Canada Goose specimen on southern gravel shoreline.",
                "species": "Canada Goose (Branta canadensis)",
                "confidence": 0.915,
                "pondZone": "south_pond",
                "location": "Tingley Beach - South Pond Shallows",
                "boxes": [{"label": "Dead Canada Goose", "confidence": 0.915, "box": [45, 38, 68, 62]}],
                "servos": True,
            },
            "illegal_fishing": {
                "type": "illegal_fishing",
                "severity": "high",
                "title": "Restricted Gear: Fishing Rod in Model Boat Pond",
                "description": "Motion sensor triggered after park closing hours (dusk cutoff). Person detected actively deploying fishing rod and line on Children’s & Model Boat pond pier.",
                "species": None,
                "confidence": 0.893,
                "pondZone": "children_pond",
                "location": "Tingley Beach - Children's & Model Boat Pond North Pier",
                "boxes": [
                    {"label": "Suspect", "confidence": 0.914, "box": [51, 55, 79, 63]},
                    {"label": "Fishing Rod", "confidence": 0.887, "box": [45, 38, 60, 56]}
                ],
                "servos": True,
            },
            "dead_fish": {
                "type": "dead_wildlife",
                "severity": "medium",
                "title": "Deceased Rainbow Trout Washed on Shoreline",
                "description": "Hourly scheduled baseline snapshot captured deceased Rainbow Trout washed ashore in shallow gravel bank. Fish showed zero movement across subsequent verification frames.",
                "species": "Rainbow Trout (Oncorhynchus mykiss)",
                "confidence": 0.968,
                "pondZone": "south_pond",
                "location": "Tingley Beach - South Catch & Release Pond",
                "boxes": [{"label": "Dead Rainbow Trout", "confidence": 0.968, "box": [41, 38, 61, 65]}],
                "servos": True,
            },
            "routine_day": {
                "type": "routine_snapshot",
                "severity": "info",
                "title": "Hourly Timed Baseline Capture",
                "description": "Scheduled hourly heartbeat capture. Water level nominal, no surface obstructions, no wildlife distress, no unauthorized persons present.",
                "species": None,
                "confidence": 0.99,
                "pondZone": "central_pond",
                "location": "Tingley Beach - Central Pond North Pier View",
                "boxes": [],
                "servos": False,
            }
        }

        data = scenarios.get(scenario_key, scenarios["dead_duck"])
        svg_content = SVGS.get(scenario_key, SVGS["dead_duck"])
        image_uri = to_data_uri(svg_content)

        # 3. Physical / Virtual Actuation
        if data["servos"]:
            self.deploy_servos_alert()
        else:
            self.reset_to_idle()

        # 4. Create Incident Payload
        incident_id = f"sim-{int(time.time() * 1000) % 1000000}"
        payload = {
            "apiKey": DEVICE_API_KEY,
            "id": incident_id,
            "deviceId": DEVICE_ID,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "trigger": "hourly_timer" if scenario_key == "routine_day" else "pir_motion",
            "type": data["type"],
            "title": data["title"],
            "description": data["description"],
            "species": data["species"],
            "confidence": data["confidence"],
            "severity": data["severity"],
            "location": data["location"],
            "pondZone": data["pondZone"],
            "imageUrl": image_uri,
            "boundingBoxes": data["boxes"],
            "servosTriggered": data["servos"],
            "servoAngle": 180 if data["servos"] else 0,
            "ledState": self.led_state,
            "sendEmail": data["servos"],
            "notes": "Generated by Tingley Beach Sentinel macOS Hardware Device Simulator."
        }

        # 5. Dispatch to Cloud Dashboard & Local Dashboard
        Thread(target=self._dispatch_incident, args=(payload,), daemon=True).start()
        return payload

    def _dispatch_incident(self, payload):
        endpoints = [
            f"{VERCEL_DASHBOARD_URL}/api/alerts",
            f"{LOCAL_DASHBOARD_URL}/api/alerts"
        ]
        headers = {"Content-Type": "application/json", "x-api-key": DEVICE_API_KEY}

        for ep in endpoints:
            try:
                r = requests.post(ep, json=payload, headers=headers, timeout=5)
                if r.status_code in (200, 201):
                    print(f"{C_GREEN}✓ Incident uploaded to dashboard ({ep}) [HTTP {r.status_code}]{C_RESET}")
            except Exception:
                # Endpoint unreachable (e.g. local 3000 offline)
                pass

    def sync_telemetry_cloud(self):
        """Dispatches live device simulator vitals to dashboard telemetry API."""
        status = self.get_status_dict()
        endpoints = [
            f"{VERCEL_DASHBOARD_URL}/api/telemetry",
            f"{LOCAL_DASHBOARD_URL}/api/telemetry"
        ]
        headers = {"Content-Type": "application/json", "x-api-key": DEVICE_API_KEY}

        for ep in endpoints:
            try:
                requests.post(ep, json=status, headers=headers, timeout=3)
            except Exception:
                pass

    def start_cloud_command_poller(self):
        """Polls cloud command queue for buttons pressed in Vercel Admin Panel."""
        def _poller():
            while self.running:
                try:
                    r = requests.get(COMMAND_QUEUE_URL, timeout=3)
                    if r.status_code == 200:
                        payload = r.json()
                        data = payload.get("data", {})
                        ts = data.get("timestamp", 0)

                        if ts > self.last_command_ts:
                            self.last_command_ts = ts
                            cmd = data.get("command")
                            print(f"\n{C_MAGENTA}⚡ [CLOUD QUEUE] Received Remote Actuator Command: {cmd}{C_RESET}")

                            if cmd == "reset_servos":
                                self.reset_to_idle()
                            elif cmd == "deploy_servos":
                                self.deploy_servos_alert()
                            elif cmd == "set_leds":
                                color = data.get("ledColor", "green")
                                self.set_leds(
                                    green=(color == "green"),
                                    yellow=(color == "yellow"),
                                    red=(color == "red")
                                )
                            elif cmd == "capture_now":
                                self.trigger_scenario("dead_duck")

                except Exception:
                    pass
                time.sleep(1.2)

        Thread(target=_poller, daemon=True).start()

    def start_heartbeat_loop(self):
        """Periodically syncs vitals every 3.5 seconds and runs auto-simulate if enabled."""
        def _loop():
            counter = 0
            scenarios = ["dead_duck", "illegal_fishing", "dead_fish", "dead_goose", "routine_day"]
            while self.running:
                time.sleep(3.5)
                # Jitter vitals slightly
                self.cpu_temp = round(46.0 + (counter % 5) * 0.25, 1)
                self.cpu_usage = 18 + (counter % 6) * 2
                self.voltage = round(5.11 + ((counter % 3) * 0.01), 2)
                self.sync_telemetry_cloud()
                counter += 1

                # If auto-simulation is enabled, trigger scenario every ~18 seconds
                if self.auto_simulate and counter % 5 == 0:
                    scenario = scenarios[self.auto_scenario_idx % len(scenarios)]
                    self.auto_scenario_idx += 1
                    print(f"\n{C_BLUE}🤖 [AUTO-SIMULATE] Autonomous Event Cycle ({self.auto_scenario_idx}){C_RESET}")
                    self.trigger_scenario(scenario)

        Thread(target=_loop, daemon=True).start()

    def run_cli_loop(self):
        """Interactive keyboard handler for terminal control."""
        self.print_banner()

        if not sys.stdin.isatty():
            print(f"{C_GREEN}Running in background daemon mode. Listening on port {PORT}...{C_RESET}")
            try:
                while self.running:
                    time.sleep(1.0)
            except KeyboardInterrupt:
                pass
            return

        while self.running:
            try:
                choice = input(f"{C_CYAN}simulator>{C_RESET} ").strip().lower()
                if not choice:
                    continue

                if choice == "1":
                    self.trigger_scenario("dead_duck")
                elif choice == "2":
                    self.trigger_scenario("dead_goose")
                elif choice == "3":
                    self.trigger_scenario("illegal_fishing")
                elif choice == "4":
                    self.trigger_scenario("dead_fish")
                elif choice == "5":
                    self.trigger_scenario("routine_day")
                elif choice == "m":
                    self.pulse_pir_motion()
                elif choice == "d":
                    self.deploy_servos_alert()
                elif choice == "r":
                    self.reset_to_idle()
                elif choice == "g":
                    self.set_leds(green=True, yellow=False, red=False)
                elif choice == "y":
                    self.set_leds(green=False, yellow=True, red=False)
                elif choice == "e":
                    self.set_leds(green=False, yellow=False, red=True)
                elif choice == "a":
                    self.auto_simulate = not self.auto_simulate
                    state_str = f"{C_GREEN}ENABLED (every 18s){C_RESET}" if self.auto_simulate else f"{C_YELLOW}DISABLED{C_RESET}"
                    print(f"Auto-Simulate is now {state_str}")
                elif choice == "s":
                    self.print_state()
                elif choice in ("q", "quit", "exit"):
                    print("Exiting simulator...")
                    self.running = False
                    break
                else:
                    print("Unrecognized command. Type [1-5], [m], [d], [r], [g/y/e], [a], or [q].")

            except EOFError:
                print(f"{C_BLUE}Terminal input closed. Continuing in background server mode on port {PORT}...{C_RESET}")
                try:
                    while self.running:
                        time.sleep(1.0)
                except KeyboardInterrupt:
                    pass
                break
            except KeyboardInterrupt:
                print("\nExiting simulator...")
                self.running = False
                break


def main():
    simulator = TingleyDeviceSimulator()
    SimulatorHTTPHandler.simulator = simulator

    # Start local HTTP server on port 8080
    try:
        server = HTTPServer(("0.0.0.0", PORT), SimulatorHTTPHandler)
        server_thread = Thread(target=server.serve_forever, daemon=True)
        server_thread.start()
    except Exception as e:
        print(f"{C_RED}Warning: Port {PORT} already bound or restricted: {e}{C_RESET}")

    # Start background polling and telemetry heartbeat
    simulator.start_cloud_command_poller()
    simulator.start_heartbeat_loop()

    # Initial sync to announce simulator presence
    simulator.sync_telemetry_cloud()

    # Run foreground CLI interaction
    simulator.run_cli_loop()


if __name__ == "__main__":
    main()
