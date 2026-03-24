import lgpio
import time

# Open the GPIO chip
h = lgpio.gpiochip_open(4)

# Set the pin number you want to read
INPUT_PIN = 17
lgpio.gpio_claim_input(h, INPUT_PIN, lFlags=lgpio.SET_PULL_UP)

try:
    while True:
        value = lgpio.gpio_read(h, INPUT_PIN)
        print(f"Input pin value: {value}")
        time.sleep(1)
except KeyboardInterrupt:
    pass
finally:
    lgpio.gpiochip_close(h)