"""
Camera capture controller for Tingley Beach Camera Sentinel
Interfaces with Raspberry Pi Camera Module via MIPI-CSI (libcamera / picam2)
"""

import os
import time
import subprocess
import logging
from config import CAMERA_RESOLUTION, CAMERA_ROTATION, CAPTURE_DIR

logger = logging.getLogger("TingleyCamera")


class CameraController:
    def __init__(self):
        os.makedirs(CAPTURE_DIR, exist_ok=True)
        self.use_picam2 = False

        # Attempt to test picamera2 or libcamera
        try:
            from picamera2 import Picamera2
            self.picam2 = Picamera2()
            config = self.picam2.create_still_configuration(main={"size": CAMERA_RESOLUTION})
            self.picam2.configure(config)
            self.picam2.start()
            self.use_picam2 = True
            logger.info("Hardware Picamera2 initialized successfully.")
        except Exception as e:
            logger.warning(f"Picamera2 initialization error ({e}). Falling back to rpicam-still / libcamera CLI.")

    def capture_frame(self, filename_prefix="capture"):
        """Captures a frame and returns the saved file path."""
        timestamp = int(time.time())
        output_path = os.path.join(CAPTURE_DIR, f"{filename_prefix}_{timestamp}.jpg")

        if self.use_picam2:
            try:
                self.picam2.capture_file(output_path)
                logger.info(f"Frame captured via Picamera2: {output_path}")
                return output_path
            except Exception as e:
                logger.error(f"Picamera2 capture failed: {e}")

        # Attempt CLI libcamera-still / rpicam-still
        cmd = [
            "rpicam-still",
            "-o", output_path,
            "--width", str(CAMERA_RESOLUTION[0]),
            "--height", str(CAMERA_RESOLUTION[1]),
            "--rotation", str(CAMERA_ROTATION),
            "-t", "500",  # 500ms exposure warmup
            "-n"          # No preview window (headless)
        ]

        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=8)
            if res.returncode == 0 and os.path.exists(output_path):
                logger.info(f"Frame captured via rpicam-still: {output_path}")
                return output_path
        except (FileNotFoundError, subprocess.SubprocessError):
            pass

        # Fallback dummy capture for development / headless simulation
        logger.info(f"Generating simulated test frame at {output_path}")
        with open(output_path, "wb") as f:
            # Simple minimal 1x1 placeholder JPEG header
            f.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9')
        return output_path
