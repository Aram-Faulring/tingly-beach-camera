# Tingley Beach Sentinel: Master System Reference & Handoff Document

> **Project Overview**: Autonomous edge AI monitoring unit stationed at Tingley Beach (Albuquerque, NM). Employs a Raspberry Pi 4 Model B with an OV5647 1080p camera, PIR motion interrupt sensor, dual SG90 micro servos for physical alert flag deployment (0° rest to 180° alert), dual 3-LED traffic light status modules, and real-time cloud synchronization to a Vercel-hosted Next.js dashboard with Resend automated email dispatching.

---

## 1. Quick Access Links & Online Assets

| Service / Resource | Location / URL | Notes |
| :--- | :--- | :--- |
| **GitHub Repository** | `https://github.com/Aram-Faulring/tingly-beach-camera` | Public repository, branch `main` |
| **Live Web Dashboard** | `https://tingly-beach-camera-nj21.vercel.app` | Hosted on Vercel (Production) |
| **Admin Panel Login** | Click **Admin** on dashboard &rarr; Password: `tingley2026` | Manages email alerts, hardware servos, LEDs, simulations |
| **Pi Local LAN URL** | `http://tingley-cam.local:8080/status` | Zero-latency local network status & control |
| **Cloud Command Queue**| `https://api.restful-api.dev/objects/ff808181a09d98f701a1f6f5bf537d79` | Synchronizes web dashboard buttons to Pi in real time |
| **Resend Email Service**| `https://resend.com` | Dedicated API Key: `re_h3fwTKpX_...` (configured on Vercel) |

---

## 2. Raspberry Pi 4 Hardware Configuration

### Device Identity & Access
- **Hostname**: `tingley-cam.local`
- **Current Local IP**: `192.168.4.63`
- **Default User**: `pi`
- **SSH Authentication**: Passwordless SSH configured using `~/.ssh/id_ed25519`
- **Sudo Permissions**: Passwordless sudo configured at `/etc/sudoers.d/010_pi-nopasswd`
- **OS Kernel**: Linux 6.x (Debian Trixie/Bookworm 64-bit aarch64)

### Wi-Fi Profiles (Autoconnect Configured in NetworkManager)
1. **Home Wi-Fi**: `Quiche` (WPA2/WPA3 Personal) - Autoconnect enabled.
2. **School Wi-Fi**: `SPS Wifi` (Open, unencrypted / no password) - Priority 50, autoconnect enabled.
3. **School Wi-Fi (Alt)**: `SPS WiFi` (Open, unencrypted / no password) - Priority 50, autoconnect enabled.

### GPIO Pin Mapping (BCM Numbering)
Breakout ribbon connects Pi 4 40-pin header to breadboard:

| Component | Pin (BCM) | Physical Header Pin | Function / Logic |
| :--- | :--- | :--- | :--- |
| **PIR Motion Sensor** | **GPIO 17** | Pin 11 | Digital input (HIGH = motion detected, 3s debounce) |
| **Micro Servo 1 (SG90)** | **GPIO 12** | Pin 32 | Hardware PWM0 (50Hz: 0.025 = 0° rest, 0.125 = 180° alert) |
| **Micro Servo 2 (SG90)** | **GPIO 13** | Pin 33 | Hardware PWM1 (50Hz: 0.025 = 0° rest, 0.125 = 180° alert) |
| **Traffic Module 1 - Green** | **GPIO 22** | Pin 15 | Active HIGH: System nominal / monitoring idle |
| **Traffic Module 1 - Yellow**| **GPIO 27** | Pin 13 | Active HIGH: Frame capture / inference running |
| **Traffic Module 1 - Red** | **GPIO 18** | Pin 12 | Active HIGH: Incident flagged / alert active |
| **Traffic Module 2 - Green** | **GPIO 23** | Pin 16 | Paired with Module 1 |
| **Traffic Module 2 - Yellow**| **GPIO 24** | Pin 18 | Paired with Module 1 |
| **Traffic Module 2 - Red** | **GPIO 25** | Pin 22 | Paired with Module 1 |
| **Power Bus (+5V)** | 5V | Pin 2 & Pin 4 | Powers SG90 servos & PIR sensor VCC |
| **Ground Bus (GND)** | GND | Pin 6 & Pin 14 | Common ground across breadboard rails |
| **Camera Module** | MIPI-CSI | 15-pin CSI Port | OV5647 1080p sensor (controlled via `picamera2`) |

---

## 3. Raspberry Pi Software Architecture

- **Root Location**: `/opt/tingley/` (Owned by `pi:pi`)
- **Systemd Service**: `/etc/systemd/system/tingley-camera.service`
  - Enabled to start on boot: `systemctl is-enabled tingley-camera.service` &rarr; `enabled`
  - Auto-restart: `Restart=always`, `RestartSec=5`
  - Target: `After=network-online.target`

### Key Service Files on the Pi
- `/opt/tingley/service.py`: Main daemon coordinating:
  - PIR motion edge detection interrupt thread.
  - Picamera2 frame capture pipeline.
  - YOLO edge inference engine (`inference.py`).
  - Actuation controller (`gpio_controller.py`) with **15-second auto-reset timer**.
  - Cloud synchronization to Vercel API (`_sync_to_cloud`).
  - Cloud command poller (`_poll_cloud_commands`) polling every 1.2s for web admin commands.
  - Local HTTP control server on port 8080 (`http://tingley-cam.local:8080`).
- `/opt/tingley/gpio_controller.py`: `gpiozero`-based hardware driver utilizing `PWMOutputDevice` for 50Hz servo signals and `LED` objects for dual traffic lights.
- `/opt/tingley/camera.py`: `Picamera2` wrapper capturing frames to `/opt/tingley/captures/`.
- `/opt/tingley/inference.py`: Edge detection logic classifying dead wildlife (Mallard duck, trout, goose) and unauthorized fishing gear.
- `/opt/tingley/config.py`: Device configuration, pin assignments, and API keys.

---

## 4. Cloud Dashboard & Web App

- **Framework**: Next.js 16.4.6, React 19, Tailwind CSS v4, Turbopack.
- **Hosting**: Vercel (Project ID: `prj_VVBwKrRkCnAwqvAXFcm5DHX0sULj`).
- **Production URL**: `https://tingly-beach-camera-nj21.vercel.app`

### Dashboard Pages & Components
- `dashboard/app/page.tsx`: Single-page app with view toggles (**Live Gallery** vs. **Pond Map**).
- `dashboard/components/Navbar.tsx`: Minimalist top header with live online status badge, refresh button, and lock-protected Admin access button.
- `dashboard/components/MetricsCards.tsx`: Top summary cards (Total Captures, Dead Wildlife, Fishing Violations, Hourly Baselines).
- `dashboard/components/IncidentGallery.tsx`: High-resolution card grid with category tags, confidence badges, and full image view modals.
- `dashboard/components/IncidentModal.tsx`: High-resolution photo inspector with bounding box overlays and detection telemetry.
- `dashboard/components/AdminPanelModal.tsx`: Password-gated admin modal:
  - **Email Recipient Management**: Configure destination email address, toggle automated emails, send test alerts.
  - **Actuator Hardware Controls**: Reset Servos to 0° (Rest), Deploy Servos to 180° (Alert), LED test controls (Green, Yellow, Red).
  - **Scenario Simulation**: Trigger test PIR events on demand.
  - **Reset Data**: Reset demo incidents to baseline.

### API Routes
- `/api/alerts`: Ingests alerts from Pi (`POST`) and returns incidents list (`GET`).
- `/api/admin`: Authenticates admin (`tingley2026`), saves email config, dispatches actuator commands to cloud queue.
- `/api/commands`: Returns queued commands for Pi polling.
- `/api/email`: Sends alert emails via Resend SDK (`resend.emails.send`).
- `/api/simulate`: Triggers test scenarios without physical motion.
- `/api/telemetry`: Reports Pi vitals (temp, RAM, wifi, servo angles).

---

## 5. How to Reconnect & Resume From Scratch

If you ever need to set this up on a new computer or assist again:

### Step 1: Clone the Repository
```bash
git clone https://github.com/Aram-Faulring/tingly-beach-camera.git
cd tingly-beach-camera
```

### Step 2: SSH into the Raspberry Pi
Ensure your laptop is on the same network (home Wi-Fi or school Wi-Fi):
```bash
ssh pi@tingley-cam.local
# Or by IP if mDNS is unavailable:
ssh pi@192.168.4.63
```

### Step 3: Monitor or Control the Pi Daemon
```bash
# Check service status:
sudo systemctl status tingley-camera.service

# View live streaming daemon logs:
sudo journalctl -u tingley-camera.service -f

# Restart service after code changes:
sudo systemctl restart tingley-camera.service
```

### Step 4: Run the Dashboard Locally (Optional)
```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000
```

### Step 5: Push Updates to Live Production
Any commit pushed to `main` on GitHub triggers an automatic Vercel build and deployment:
```bash
git add .
git commit -m "Update feature"
git push origin main
```
