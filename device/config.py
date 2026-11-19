import os

# Device & Location
DEVICE_ID = os.getenv("DEVICE_ID", "tingley-pi4-01")
LOCATION_NAME = "Tingley Beach - Albuquerque, NM"
ZONE_NAME = "Children's & Model Boat Pond"

# Cloud Dashboard API
DASHBOARD_API_URL = os.getenv("DASHBOARD_API_URL", "https://tingly-beach-camera.vercel.app/api/alerts")
API_KEY = os.getenv("DEVICE_API_KEY", "tingley-edge-secret-key-2026")
HEARTBEAT_INTERVAL_SECONDS = 3600  # 1 hour baseline capture

# Hardware Pin Assignments (BCM numbering)
# Breadboard connected to Pi 4 via GPIO breakout ribbon
PIN_PIR_MOTION = 17         # PIR Motion Sensor digital out (Fresnel dome)

# Traffic Light LED Modules (2x modules with Red, Yellow, Green)
PIN_LED1_GREEN = 22
PIN_LED1_YELLOW = 27
PIN_LED1_RED = 18

PIN_LED2_GREEN = 23
PIN_LED2_YELLOW = 24
PIN_LED2_RED = 25

# Micro Servos (SG90) - Hardware/Software PWM
PIN_SERVO_1 = 12            # Hardware PWM0 (GPIO 12)
PIN_SERVO_2 = 13            # Hardware PWM1 (GPIO 13)
SERVO_ALERT_ANGLE = 180     # Target rotation on confirmed incident
SERVO_RESET_ANGLE = 0       # Rest position

# Camera Configuration
CAMERA_RESOLUTION = (1920, 1080)
CAMERA_ROTATION = 0
CAPTURE_DIR = "/opt/tingley/captures"

# Edge Inference Settings
CONFIDENCE_THRESHOLD = 0.50
MODEL_PATH = "/opt/tingley/models/yolov8n_wildlife_fishing.onnx"

# Notification / Detection Categories
TARGET_CLASSES = {
    "dead_animal": ["dead_duck", "dead_goose", "dead_fish", "dead_bird", "dead_animal"],
    "illegal_fishing": ["fishing_rod", "fishing_net", "angler_restricted_zone"]
}
