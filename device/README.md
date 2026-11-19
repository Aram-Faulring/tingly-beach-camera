# Raspberry Pi 4 Client Setup: Tingley Beach Sentinel

## 1. Operating System
- Flash **Raspberry Pi OS (64-bit Lite or Desktop)** via Raspberry Pi Imager.
- In Imager Settings (gear icon):
  - Configure Wi-Fi SSID and Password.
  - Enable SSH with public key or password.
  - Set hostname to `tingley-cam`.

## 2. Hardware Wiring (Breadboard & GPIO)
- **Power**: Connect official USB-C 5V/3A AC wall adapter.
- **Camera**: Connect Raspberry Pi Camera Module into the CSI port with ribbon cable.
- **GPIO Ribbon**: Connect 40-pin GPIO breakout to the breadboard:
  - **Red Power Rail (+)**: Connect to Pin 2 (5V DC).
  - **Blue Ground Rail (-)**: Connect to Pin 6 (GND).
- **PIR Motion Sensor (Plastic Dome)**:
  - VCC -> Red Rail (+5V)
  - GND -> Blue Rail (GND)
  - OUT -> GPIO 17 (Pin 11)
- **Traffic Light LED Module 1**:
  - Green -> GPIO 22 (Pin 15)
  - Yellow -> GPIO 27 (Pin 13)
  - Red -> GPIO 18 (Pin 12)
  - GND -> Blue Rail (GND)
- **Traffic Light LED Module 2**:
  - Green -> GPIO 23 (Pin 16)
  - Yellow -> GPIO 24 (Pin 18)
  - Red -> GPIO 25 (Pin 22)
  - GND -> Blue Rail (GND)
- **2x Micro Servos (SG90)**:
  - Red wires -> Red Rail (+5V)
  - Brown/Black wires -> Blue Rail (GND)
  - Yellow/Orange signal wires -> GPIO 12 (Pin 32, PWM0) & GPIO 13 (Pin 33, PWM1)
  - *Actuation Rule*: Rotates 180° when dead animal or illegal fishing is flagged.
- **Optional Field Demo Monitor**:
  - Connect micro-HDMI to HDMI cable from Pi 4 micro-HDMI port 0 to portable screen.

## 3. Installation on Pi
```bash
# Clone the repository
git clone https://github.com/Aram-Faulring/tingly-beach-camera.git /opt/tingley
cd /opt/tingley/device

# Install python dependencies
sudo apt-get update
sudo apt-get install -y python3-pip python3-picamera2 python3-opencv python3-rpi.gpio
pip3 install -r requirements.txt

# Test the service
python3 service.py
```

## 4. Install Systemd Service (Auto-start on Boot)
```bash
sudo cp tingley-camera.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tingley-camera.service
sudo systemctl start tingley-camera.service
sudo systemctl status tingley-camera.service
```
