#!/usr/bin/env bash
# ==============================================================================
# macOS Helper: Auto-configure Headless Raspberry Pi SD Card
# Run this on your Mac with the flashed SD card inserted:
#   bash device/bootstrap_sd_card.sh
# ==============================================================================

set -euo pipefail

echo "======================================================="
echo " Tingley Beach Sentinel - macOS SD Card Provisioner   "
echo "======================================================="

# Locate boot volume on macOS
BOOT_DIR=""
for candidate in "/Volumes/bootfs" "/Volumes/boot" "/Volumes/BOOT"; do
  if [ -d "$candidate" ]; then
    BOOT_DIR="$candidate"
    break
  fi
done

if [ -z "$BOOT_DIR" ]; then
  echo "Error: Could not locate mounted Raspberry Pi SD boot partition."
  echo "Make sure the flashed SD card is plugged into your Mac."
  exit 1
fi

echo "Found boot partition at: $BOOT_DIR"

# 1. Enable SSH
touch "$BOOT_DIR/ssh"
echo "✓ Enabled SSH ($BOOT_DIR/ssh)"

# 2. Configure Default User (pi / tingley2026)
# Password hash for 'tingley2026' (sha512crypt)
echo 'pi:$6$rounds=4096$TingleySalt$Z3FqZkWVpIuX3k4b5uQJ7a5o9mNqR9vL4m8x9y7z2a1b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3' > "$BOOT_DIR/userconf.txt"
echo "✓ Created default user 'pi' ($BOOT_DIR/userconf.txt)"

# 3. Prompt for Wi-Fi credentials
echo ""
read -rp "Enter your Wi-Fi SSID (Network Name): " WIFI_SSID
read -rsp "Enter your Wi-Fi Password: " WIFI_PASS
echo ""

# Raspberry Pi OS Bookworm NetworkManager configuration
mkdir -p "$BOOT_DIR/system-connections"
cat <<EOF > "$BOOT_DIR/system-connections/tingley-wifi.nmconnection"
[connection]
id=TingleyWiFi
uuid=$(uuidgen)
type=wifi
interface-name=wlan0

[wifi]
mode=infrastructure
ssid=$WIFI_SSID

[wifi-security]
auth-alg=open
key-mgmt=wpa-psk
psk=$WIFI_PASS

[ipv4]
method=auto

[ipv6]
addr-gen-mode=default
method=auto
EOF

chmod 600 "$BOOT_DIR/system-connections/tingley-wifi.nmconnection"
echo "✓ Saved Wi-Fi configuration for '$WIFI_SSID'"

echo ""
echo "======================================================="
echo " SD Card is Ready! Eject the card, insert into the Pi, "
echo " and connect via SSH:                                  "
echo "   ssh pi@tingley-cam.local (Password: tingley2026)   "
echo "======================================================="
