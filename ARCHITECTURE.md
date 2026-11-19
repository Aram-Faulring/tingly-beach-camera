# System Architecture: Tingley Beach Camera

## 1. Operating System & Remote Access
- **OS**: Clean Raspberry Pi OS (64-bit Lite / Bookworm recommended)
- **Headless Provisioning**: Preconfigured Wi-Fi credentials and enabled SSH for direct network access
- **Remote Access**: Direct SSH access for maintenance, updates, and configuration

## 2. Edge Device (Raspberry Pi 4)
- **Hardware Integration**:
  - **Camera**: Raspberry Pi Camera Module via MIPI-CSI (interfaced with `libcamera` / `picam2`)
  - **Motion Trigger**: PIR sensor on GPIO via hardware interrupt
  - **Timed Heartbeat**: Scheduled hourly capture loop (default fallback)
  - **Actuators & Indicators**:
    - 2x Traffic Light LED modules (Green = Idle/Monitoring, Yellow = Capturing/Inference, Red = Alert)
    - 2x Micro Servos (rotate 180° upon confirmed incident)
  - **Demo Display**: Optional micro-HDMI monitor for field demos / on-site preview
- **Local Inference Engine**:
  - CPU-optimized quantized model (e.g., YOLOv8n via ONNX Runtime / NCNN)
  - Detection targets: Dead wildlife / species identification, unauthorized fishing activities
- **Sync & Dispatch**:
  - Secure HTTPS client pushing incident metadata and compressed image frames to cloud API

## 3. Cloud Backend & Web Dashboard (Vercel)
- **Framework**: Next.js (hosted on Vercel, synced with GitHub)
- **API Endpoints**: Ingestion route receiving event payloads from Pi
- **Alert Dispatch**: Email notifications (via Resend) sent to designated recipients upon incident detection
- **Dashboard UI**: Web interface to review alerts, historical captures, detections, and device status
