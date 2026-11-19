# Hardware Configuration: Tingley Beach Camera

## Compute & Power
- **Device**: Raspberry Pi 4 Model B
- **Power Delivery**: Direct USB-C to AC wall adapter (5V / 3A)
- **Networking**: Onboard Wi-Fi (direct connection to local wireless network)

## Sensor & Capture
- **Camera Module**: Standard Raspberry Pi Camera Module connected via standard CSI ribbon cable (MIPI-CSI)
- **Motion Sensor**: PIR motion sensor with Fresnel dome lens, connected to GPIO via breadboard
- **Enclosure**: Outdoor weather-resistant housing (TBD)

## Current Physical Wiring State (As-Built)
- **Camera**: Standard Raspberry Pi Camera Module connected via CSI ribbon cable.
- **Breadboard Power Rails**:
  - **Red Power Rail (+)**: Wired to Raspberry Pi 5V pin.
  - **Blue Ground Rail (-)**: Wired to Raspberry Pi GND pin.
- **Pending Wiring**: PIR motion sensor, 2x traffic light LED modules, and 2x micro servos to be placed and connected.

## GPIO Expansion & Breadboard Peripherals (Planned)
- **Breakout**: Raspberry Pi GPIO extension / breakout ribbon bringing pins to a solderless breadboard
- **Status Indicators**: 2x Traffic Light LED modules (Red / Yellow / Green) for visual state indication (e.g., Idle/Ready, Active Capture/Inference, Alert)
- **Physical Actuators**: 2x Micro Servos (e.g., SG90)
  - **Action**: Rotate 180 degrees upon detected incident (dead animal or illegal fishing)
- **Pin Assignments**: No fixed pins yet (default standard BCM pin mapping will be defined in configuration)

## Optional Field / Demo Peripherals
- **Field Display**: Portable monitor connected via micro-HDMI (reserved for on-site debugging and live demonstrations; device runs headless during regular deployment)
