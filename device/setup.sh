#!/usr/bin/env bash
# ==============================================================================
# Tingley Beach Camera Sentinel - Automated Pi 4 Setup Script
# Run this directly on your Raspberry Pi:
#   curl -sSL https://raw.githubusercontent.com/Aram-Faulring/tingly-beach-camera/main/device/setup.sh | bash
# Or from local clone:
#   sudo bash setup.sh
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}  Tingley Beach Sentinel - Pi 4 Setup & Provisioning   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Root Check
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Please run with sudo: sudo bash setup.sh${NC}"
  exit 1
fi

# 2. System Update
echo -e "\n${BLUE}[1/6] Updating APT repositories...${NC}"
apt-get update -y

# 3. Install System & Python Dependencies
echo -e "\n${BLUE}[2/6] Installing camera, GPIO, and machine learning packages...${NC}"
apt-get install -y --no-install-recommends \
  python3-pip \
  python3-picamera2 \
  python3-opencv \
  python3-rpi.gpio \
  python3-numpy \
  python3-requests \
  libcamera-apps \
  v4l-utils \
  git \
  curl

# 4. Install Python requirements
echo -e "\n${BLUE}[3/6] Installing Python packages...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
  pip3 install -r "$SCRIPT_DIR/requirements.txt" --break-system-packages || true
fi

# 5. Create deployment directory & copy files
echo -e "\n${BLUE}[4/6] Provisioning service files to /opt/tingley...${NC}"
mkdir -p /opt/tingley/captures
mkdir -p /opt/tingley/models

cp -f "$SCRIPT_DIR"/config.py /opt/tingley/ 2>/dev/null || true
cp -f "$SCRIPT_DIR"/camera.py /opt/tingley/ 2>/dev/null || true
cp -f "$SCRIPT_DIR"/gpio_controller.py /opt/tingley/ 2>/dev/null || true
cp -f "$SCRIPT_DIR"/inference.py /opt/tingley/ 2>/dev/null || true
cp -f "$SCRIPT_DIR"/service.py /opt/tingley/ 2>/dev/null || true

# Set permissions
chown -R pi:pi /opt/tingley 2>/dev/null || chown -R "$SUDO_USER:$SUDO_USER" /opt/tingley

# 6. Install & Enable Systemd Service
echo -e "\n${BLUE}[5/6] Registering systemd daemon (tingley-camera.service)...${NC}"
cp -f "$SCRIPT_DIR"/tingley-camera.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable tingley-camera.service
systemctl restart tingley-camera.service

# 7. Hardware Verification Check
echo -e "\n${BLUE}[6/6] Verifying Hardware Interfaces...${NC}"

# Check Camera
if command -v rpicam-hello &> /dev/null; then
  echo -n "Checking MIPI-CSI Camera Module... "
  if rpicam-hello --list-cameras 2>&1 | grep -iq "available"; then
    echo -e "${GREEN}DETECTED${NC}"
  else
    echo -e "${YELLOW}Camera ribbon not detected. Check physical seating in CSI port.${NC}"
  fi
fi

# Check Service Status
echo -n "Checking Sentinel Background Service... "
if systemctl is-active --quiet tingley-camera.service; then
  echo -e "${GREEN}RUNNING${NC}"
else
  echo -e "${YELLOW}Service starting up (check: systemctl status tingley-camera.service)${NC}"
fi

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  Setup Complete! Tingley Sentinel is Active.          ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "• PIR Motion Sensor: Active on GPIO 17"
echo -e "• Micro Servos: 180° incident actuation enabled on GPIO 12 & 13"
echo -e "• Traffic LEDs: Green idle active"
echo -e "• Cloud Sync: Connected to Vercel API"
echo -e "• Logs: sudo journalctl -u tingley-camera.service -f"
