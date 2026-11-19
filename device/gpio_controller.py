"""
GPIO Controller for Tingley Beach Camera Sentinel
Manages:
- PIR Motion Sensor (Fresnel dome) with interrupt callback
- 2x Traffic Light LED modules (Red, Yellow, Green)
- 2x Micro Servos (SG90) with 180-degree rotation actuation on alert
"""

import time
import logging
from config import (
    PIN_PIR_MOTION,
    PIN_LED1_GREEN, PIN_LED1_YELLOW, PIN_LED1_RED,
    PIN_LED2_GREEN, PIN_LED2_YELLOW, PIN_LED2_RED,
    PIN_SERVO_1, PIN_SERVO_2,
    SERVO_ALERT_ANGLE, SERVO_RESET_ANGLE
)

logger = logging.getLogger("TingleyGPIO")

# Attempt hardware GPIO import; fall back to software mock if running off-Pi
try:
    import RPi.GPIO as GPIO
    IS_PI_HARDWARE = True
except (ImportError, RuntimeError):
    IS_PI_HARDWARE = False
    logger.warning("RPi.GPIO not detected. Running in simulated GPIO mock mode.")


class HardwareGPIOController:
    def __init__(self, on_motion_detected=None):
        self.on_motion_callback = on_motion_detected
        self.servo1_pwm = None
        self.servo2_pwm = None
        self.current_servo_angle = 0
        self.current_led_state = {"green": True, "yellow": False, "red": False}
        self._setup_pins()

    def _setup_pins(self):
        if not IS_PI_HARDWARE:
            logger.info("Mock GPIO initialized: Breadboard 5V / GND bus live.")
            return

        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)

        # PIR Motion Sensor (Input with pull-down resistor)
        GPIO.setup(PIN_PIR_MOTION, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

        # Traffic Light LEDs Output
        led_pins = [
            PIN_LED1_GREEN, PIN_LED1_YELLOW, PIN_LED1_RED,
            PIN_LED2_GREEN, PIN_LED2_YELLOW, PIN_LED2_RED
        ]
        for pin in led_pins:
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.LOW)

        # Servos Output (PWM 50Hz)
        GPIO.setup(PIN_SERVO_1, GPIO.OUT)
        GPIO.setup(PIN_SERVO_2, GPIO.OUT)
        self.servo1_pwm = GPIO.PWM(PIN_SERVO_1, 50)
        self.servo2_pwm = GPIO.PWM(PIN_SERVO_2, 50)
        self.servo1_pwm.start(2.5)  # 0 degrees
        self.servo2_pwm.start(2.5)

        # Set default state: Idle monitoring
        self.set_leds(green=True, yellow=False, red=False)
        self.rotate_servos(SERVO_RESET_ANGLE)

        # Register PIR Motion Interrupt
        if self.on_motion_callback:
            GPIO.add_event_detect(
                PIN_PIR_MOTION,
                GPIO.RISING,
                callback=self._motion_interrupt_handler,
                bouncetime=3000  # 3-second debounce
            )
            logger.info(f"PIR Motion interrupt attached on GPIO {PIN_PIR_MOTION}")

    def _motion_interrupt_handler(self, channel):
        logger.info(f"PIR motion sensor interrupt triggered on GPIO {channel}!")
        if self.on_motion_callback:
            self.on_motion_callback()

    def set_leds(self, green=False, yellow=False, red=False):
        """Update both traffic light LED modules simultaneously."""
        self.current_led_state = {"green": green, "yellow": yellow, "red": red}
        logger.info(f"Setting LEDs -> Green: {green}, Yellow: {yellow}, Red: {red}")

        if IS_PI_HARDWARE:
            GPIO.output(PIN_LED1_GREEN, GPIO.HIGH if green else GPIO.LOW)
            GPIO.output(PIN_LED2_GREEN, GPIO.HIGH if green else GPIO.LOW)

            GPIO.output(PIN_LED1_YELLOW, GPIO.HIGH if yellow else GPIO.LOW)
            GPIO.output(PIN_LED2_YELLOW, GPIO.HIGH if yellow else GPIO.LOW)

            GPIO.output(PIN_LED1_RED, GPIO.HIGH if red else GPIO.LOW)
            GPIO.output(PIN_LED2_RED, GPIO.HIGH if red else GPIO.LOW)

    def rotate_servos(self, angle=180):
        """
        Rotates both micro servos to target angle (0 to 180 degrees).
        Standard SG90 duty cycle: 2.5% (0 deg) to 12.5% (180 deg).
        """
        self.current_servo_angle = angle
        duty = 2.5 + (angle / 180.0) * 10.0
        logger.info(f"Rotating both micro servos to {angle}° (PWM duty cycle {duty:.1f}%)")

        if IS_PI_HARDWARE and self.servo1_pwm and self.servo2_pwm:
            self.servo1_pwm.ChangeDutyCycle(duty)
            self.servo2_pwm.ChangeDutyCycle(duty)
            time.sleep(0.6)  # Allow time for physical arm movement
            # Stop sending pulses to avoid servo jitter
            self.servo1_pwm.ChangeDutyCycle(0)
            self.servo2_pwm.ChangeDutyCycle(0)

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
        if IS_PI_HARDWARE:
            if self.servo1_pwm:
                self.servo1_pwm.stop()
            if self.servo2_pwm:
                self.servo2_pwm.stop()
            GPIO.cleanup()
            logger.info("GPIO cleanup completed.")
