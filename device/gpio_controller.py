"""
GPIO Controller for Tingley Beach Camera Sentinel
Optimized for Raspberry Pi OS (Bookworm / Trixie) with kernel 6.x
Manages:
- PIR Motion Sensor (Fresnel dome) with interrupt / edge detection
- 2x Traffic Light LED modules (Red, Yellow, Green)
- 2x Micro Servos (SG90) with 180-degree rotation actuation on alert
"""

import time
import logging
import threading

from config import (
    PIN_PIR_MOTION,
    PIN_LED1_GREEN, PIN_LED1_YELLOW, PIN_LED1_RED,
    PIN_LED2_GREEN, PIN_LED2_YELLOW, PIN_LED2_RED,
    PIN_SERVO_1, PIN_SERVO_2,
    SERVO_ALERT_ANGLE, SERVO_RESET_ANGLE
)

logger = logging.getLogger("TingleyGPIO")

# Try gpiozero first (modern Bookworm standard), fall back to RPi.GPIO
USE_GPIOZERO = False
USE_RPI_GPIO = False

try:
    from gpiozero import LED, DigitalInputDevice, PWMOutputDevice
    USE_GPIOZERO = True
    logger.info("Using modern gpiozero backend for GPIO.")
except ImportError:
    try:
        import RPi.GPIO as GPIO
        USE_RPI_GPIO = True
        logger.info("Using RPi.GPIO backend for GPIO.")
    except (ImportError, RuntimeError):
        logger.warning("No hardware GPIO library detected. Running in mock simulation mode.")


class HardwareGPIOController:
    def __init__(self, on_motion_detected=None):
        self.on_motion_callback = on_motion_detected
        self.current_servo_angle = 0
        self.current_led_state = {"green": True, "yellow": False, "red": False}
        self.monitor_running = True
        self.last_trigger_time = 0

        # Components
        self.pir_device = None
        self.led_devices = {}
        self.servo1_pwm = None
        self.servo2_pwm = None

        self._setup_hardware()

    def _setup_hardware(self):
        if USE_GPIOZERO:
            try:
                # PIR Motion sensor on GPIO 17
                self.pir_device = DigitalInputDevice(PIN_PIR_MOTION, pull_up=False)

                # Traffic Light LEDs
                self.led_devices = {
                    "l1_g": LED(PIN_LED1_GREEN),
                    "l1_y": LED(PIN_LED1_YELLOW),
                    "l1_r": LED(PIN_LED1_RED),
                    "l2_g": LED(PIN_LED2_GREEN),
                    "l2_y": LED(PIN_LED2_YELLOW),
                    "l2_r": LED(PIN_LED2_RED),
                }

                # Servos via PWMOutputDevice (50Hz = 0.02s period)
                self.servo1_pwm = PWMOutputDevice(PIN_SERVO_1, frequency=50)
                self.servo2_pwm = PWMOutputDevice(PIN_SERVO_2, frequency=50)

                # Start background thread to poll PIR with debounce
                self.poll_thread = threading.Thread(target=self._gpiozero_poll_loop, daemon=True)
                self.poll_thread.start()

                logger.info(f"gpiozero initialized: PIR on GPIO {PIN_PIR_MOTION}, Servos on {PIN_SERVO_1},{PIN_SERVO_2}")
            except Exception as e:
                logger.error(f"gpiozero initialization error: {e}")

        elif USE_RPI_GPIO:
            try:
                GPIO.setmode(GPIO.BCM)
                GPIO.setwarnings(False)
                GPIO.setup(PIN_PIR_MOTION, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

                led_pins = [
                    PIN_LED1_GREEN, PIN_LED1_YELLOW, PIN_LED1_RED,
                    PIN_LED2_GREEN, PIN_LED2_YELLOW, PIN_LED2_RED
                ]
                for pin in led_pins:
                    GPIO.setup(pin, GPIO.OUT)
                    GPIO.output(pin, GPIO.LOW)

                GPIO.setup(PIN_SERVO_1, GPIO.OUT)
                GPIO.setup(PIN_SERVO_2, GPIO.OUT)
                self.servo1_pwm = GPIO.PWM(PIN_SERVO_1, 50)
                self.servo2_pwm = GPIO.PWM(PIN_SERVO_2, 50)
                self.servo1_pwm.start(0)
                self.servo2_pwm.start(0)

                # Background thread for polling motion pin
                self.poll_thread = threading.Thread(target=self._rpi_gpio_poll_loop, daemon=True)
                self.poll_thread.start()
                logger.info(f"RPi.GPIO initialized: PIR on GPIO {PIN_PIR_MOTION}")
            except Exception as e:
                logger.error(f"RPi.GPIO setup error: {e}")

        # Set initial state: Idle monitoring (Green ON, servos at 0°)
        self.set_leds(green=True, yellow=False, red=False)
        self.rotate_servos(SERVO_RESET_ANGLE)

    def _gpiozero_poll_loop(self):
        """Threaded polling loop for PIR sensor with edge-trigger and 3-second debounce."""
        last_state = False
        while self.monitor_running:
            try:
                current_state = bool(self.pir_device.value) if self.pir_device else False
                # Rising edge detection
                if current_state and not last_state:
                    now = time.time()
                    if now - self.last_trigger_time > 3.0:
                        self.last_trigger_time = now
                        logger.info(f"PIR Motion Sensor TRIGGERED on GPIO {PIN_PIR_MOTION}!")
                        if self.on_motion_callback:
                            self.on_motion_callback()
                last_state = current_state
            except Exception as e:
                logger.debug(f"PIR poll error: {e}")
            time.sleep(0.08)

    def _rpi_gpio_poll_loop(self):
        last_state = False
        while self.monitor_running:
            try:
                current_state = bool(GPIO.input(PIN_PIR_MOTION))
                if current_state and not last_state:
                    now = time.time()
                    if now - self.last_trigger_time > 3.0:
                        self.last_trigger_time = now
                        logger.info(f"PIR Motion Sensor TRIGGERED on GPIO {PIN_PIR_MOTION}!")
                        if self.on_motion_callback:
                            self.on_motion_callback()
                last_state = current_state
            except Exception as e:
                logger.debug(f"PIR poll error: {e}")
            time.sleep(0.08)

    def set_leds(self, green=False, yellow=False, red=False):
        """Controls both traffic light LED modules."""
        self.current_led_state = {"green": green, "yellow": yellow, "red": red}
        logger.info(f"Setting LEDs -> Green: {green}, Yellow: {yellow}, Red: {red}")

        if USE_GPIOZERO and self.led_devices:
            try:
                if green:
                    self.led_devices["l1_g"].on()
                    self.led_devices["l2_g"].on()
                else:
                    self.led_devices["l1_g"].off()
                    self.led_devices["l2_g"].off()

                if yellow:
                    self.led_devices["l1_y"].on()
                    self.led_devices["l2_y"].on()
                else:
                    self.led_devices["l1_y"].off()
                    self.led_devices["l2_y"].off()

                if red:
                    self.led_devices["l1_r"].on()
                    self.led_devices["l2_r"].on()
                else:
                    self.led_devices["l1_r"].off()
                    self.led_devices["l2_r"].off()
            except Exception as e:
                logger.error(f"Error setting LEDs (gpiozero): {e}")

        elif USE_RPI_GPIO:
            try:
                GPIO.output(PIN_LED1_GREEN, GPIO.HIGH if green else GPIO.LOW)
                GPIO.output(PIN_LED2_GREEN, GPIO.HIGH if green else GPIO.LOW)
                GPIO.output(PIN_LED1_YELLOW, GPIO.HIGH if yellow else GPIO.LOW)
                GPIO.output(PIN_LED2_YELLOW, GPIO.HIGH if yellow else GPIO.LOW)
                GPIO.output(PIN_LED1_RED, GPIO.HIGH if red else GPIO.LOW)
                GPIO.output(PIN_LED2_RED, GPIO.HIGH if red else GPIO.LOW)
            except Exception as e:
                logger.error(f"Error setting LEDs (RPi.GPIO): {e}")

    def rotate_servos(self, angle=180):
        """
        Rotates micro servos to specified angle (0° to 180°).
        Duty cycle: 2.5% (0°) to 12.5% (180°).
        """
        self.current_servo_angle = angle
        # Normalized value (0.025 to 0.125 for gpiozero PWMOutputDevice)
        duty_fraction = 0.025 + (angle / 180.0) * 0.10
        logger.info(f"Rotating micro servos to {angle}° (duty fraction {duty_fraction:.3f})")

        if USE_GPIOZERO and self.servo1_pwm and self.servo2_pwm:
            try:
                self.servo1_pwm.value = duty_fraction
                self.servo2_pwm.value = duty_fraction
                time.sleep(0.5)
                # Release torque to avoid servo humming / jitter
                self.servo1_pwm.value = 0
                self.servo2_pwm.value = 0
            except Exception as e:
                logger.error(f"Error driving servos (gpiozero): {e}")

        elif USE_RPI_GPIO and self.servo1_pwm and self.servo2_pwm:
            try:
                duty_pct = duty_fraction * 100.0
                self.servo1_pwm.ChangeDutyCycle(duty_pct)
                self.servo2_pwm.ChangeDutyCycle(duty_pct)
                time.sleep(0.5)
                self.servo1_pwm.ChangeDutyCycle(0)
                self.servo2_pwm.ChangeDutyCycle(0)
            except Exception as e:
                logger.error(f"Error driving servos (RPi.GPIO): {e}")

    def trigger_incident_actuation(self):
        """Actuate alert: Set red LEDs and rotate both servos 180 degrees."""
        logger.warning("ACTUATING PHYSICAL ALERT: Servos -> 180°, LEDs -> RED")
        self.set_leds(green=False, yellow=False, red=True)
        self.rotate_servos(SERVO_ALERT_ANGLE)

    def reset_to_idle(self):
        """Return system to green monitoring state and servos to 0 degrees."""
        logger.info("Resetting actuators: Servos -> 0°, LEDs -> GREEN")
        self.set_leds(green=True, yellow=False, red=False)
        self.rotate_servos(SERVO_RESET_ANGLE)

    def cleanup(self):
        self.monitor_running = False
        if USE_GPIOZERO:
            try:
                if self.servo1_pwm: self.servo1_pwm.close()
                if self.servo2_pwm: self.servo2_pwm.close()
                if self.pir_device: self.pir_device.close()
                for led in self.led_devices.values():
                    led.close()
            except Exception:
                pass
        elif USE_RPI_GPIO:
            try:
                GPIO.cleanup()
            except Exception:
                pass
        logger.info("GPIO cleanup completed.")
