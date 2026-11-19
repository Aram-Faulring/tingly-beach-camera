# 📷 Tingley Beach Wildlife & Compliance Camera Sentinel

An autonomous edge-AI monitoring system deployed at **Tingley Beach** (Albuquerque, New Mexico) to detect deceased wildlife, classify species, and identify illegal fishing activities in real time.

---

## 🏗️ Architecture Overview

The project is structured into two main sub-systems:

1. **Edge Device (`/device`)**:
   - **Hardware**: Raspberry Pi 4 Model B powered by a continuous 5V/3A USB-C wall adapter.
   - **Camera**: Raspberry Pi Camera Module connected via MIPI-CSI ribbon cable.
   - **Triggers**:
     - **PIR Motion Sensor**: Plastic Fresnel dome sensor connected to GPIO 17 as a hardware interrupt.
     - **Hourly Scheduled Timer**: Default 60-minute heartbeat capture for environmental and baseline checks.
   - **Physical Actuators & Indicators**:
     - **2x Micro Servos (SG90)**: Actuate 180° on incident detection to raise physical alert markers/flags.
     - **2x Traffic Light LED Modules**: Green (idle monitoring), Yellow (capture/inference), Red (incident alert).
     - **Optional Field Display**: Portable monitor connected via micro-HDMI for live field debugging and demos.
   - **Edge AI**: Quantized INT8 YOLOv8 model running directly on the Pi 4 CPU to classify species (Mallard Duck, Canada Goose, Rainbow Trout, etc.) and flag unauthorized fishing.

2. **Cloud Dashboard (`/dashboard`)**:
   - **Framework**: Next.js 16 (React 19, TypeScript, Tailwind CSS).
   - **Hosting**: Deployed directly on **Vercel**, synced with GitHub.
   - **Alert Dispatch**: Serverless email notification service powered by **Resend** sending automated alerts to park rangers and wildlife officials.
   - **Interactive Console**:
     - Real-time incident feed with bounding box inspection.
     - Interactive tactical map of Tingley Beach ponds with camera FOV cone and hotspot markers.
     - Live hardware & breadboard wiring monitor showing power rails, servo angles, and LED states.
     - Built-in simulation console to test triggers on demand.

---

## 📁 Repository Structure

```
├── ARCHITECTURE.md          # End-to-end system and cloud architecture spec
├── HARDWARE.md              # Physical wiring, breadboard bus, and GPIO pin mapping
├── README.md                # Project documentation
├── dashboard/               # Next.js cloud web application (Vercel)
│   ├── app/                 # Next.js App Router (Pages & API routes)
│   │   ├── api/alerts/      # Ingestion & listing API for incidents
│   │   ├── api/email/       # Resend email alert dispatch endpoint
│   │   ├── api/simulate/    # Test scenario generator
│   │   └── api/telemetry/   # Raspberry Pi heartbeat & telemetry
│   ├── components/          # React UI components (Map, Breadboard, IncidentList, Modals)
│   ├── lib/                 # In-memory store & SVG test imagery
│   └── types/               # TypeScript interfaces (Incident, Telemetry)
└── device/                  # Raspberry Pi 4 edge client
    ├── config.py            # Pin definitions, thresholds, API endpoints
    ├── camera.py            # Picamera2 / libcamera MIPI-CSI controller
    ├── gpio_controller.py   # PIR interrupt, traffic LEDs & 180° servos
    ├── inference.py         # CPU-optimized YOLO edge inference
    ├── service.py           # Main background daemon
    ├── requirements.txt     # Python dependencies
    └── tingley-camera.service # Systemd service unit
```

---

## 🚀 Getting Started

### 1. Run the Dashboard Locally
```bash
cd dashboard
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the monitoring console.

### 2. Deploy to Vercel
1. Push repository to GitHub.
2. In Vercel, import the repository and set the **Root Directory** to `dashboard`.
3. Add optional environment variables:
   - `RESEND_API_KEY`: Your Resend API key for live email alerts.
   - `ALERT_EMAIL_RECIPIENT`: Destination email for ranger alerts (defaults to `wildlife-response@cabq.gov`).
   - `DEVICE_API_KEY`: Secret key shared between Raspberry Pi and dashboard.

### 3. Deploy to Raspberry Pi 4
Follow the detailed guide in [`device/README.md`](device/README.md).
