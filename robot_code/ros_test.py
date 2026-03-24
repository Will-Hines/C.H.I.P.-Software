#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import TwistStamped
from sensor_msgs.msg import Image

import lgpio
import time
import cv2
import numpy as np
from cv_bridge import CvBridge

from pymongo import MongoClient
import base64

# -----------------------------
# GPIO CONFIG
# -----------------------------
GPIO_CHIP = 4
INPUT_PIN = 17

# -----------------------------
# CAMERA CONFIG
# -----------------------------
DEPTH_TOPIC = "/camera/camera/depth/image_rect_raw"
COLOR_TOPIC = "/camera/camera/color/image_raw"
THRESHOLD = 0.5  # meters

# -----------------------------
# BACKEND CONFIG
# -----------------------------
uri = "https://c-h-i-p-software.onrender.com/robot-data"


class IntegratedMover(Node):
    def __init__(self):
        super().__init__('integrated_mover')

        # Publisher
        self.pub = self.create_publisher(TwistStamped, '/cmd_vel', 10)

        # Timers
        self.move_timer = self.create_timer(0.1, self.publish_cmd)
        self.sensor_timer = self.create_timer(0.01, self.check_gpio)

        # Camera subscribers
        self.bridge = CvBridge()
        self.create_subscription(Image, DEPTH_TOPIC, self.depth_callback, 10)
        self.create_subscription(Image, COLOR_TOPIC, self.color_callback, 10)

        # State
        self.sensor_active = False
        self.mongo_logged = False
        self.latest_color = None  # store last RGB frame

        # GPIO setup
        self.gpio_handle = lgpio.gpiochip_open(GPIO_CHIP)
        lgpio.gpio_claim_input(self.gpio_handle, INPUT_PIN, lFlags=lgpio.SET_PULL_UP)

        self.get_logger().info("Integrated node started (color + depth).")

    # -----------------------------
    # MOVEMENT LOGIC
    # -----------------------------
    def publish_cmd(self):
        msg = TwistStamped()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'base_link'

        if self.sensor_active:
            msg.twist.linear.x = 0.0
            msg.twist.angular.z = 0.0
        else:
            msg.twist.linear.x = -0.2
            msg.twist.angular.z = 0.0

        self.pub.publish(msg)

    # -----------------------------
    # GPIO SENSOR
    # -----------------------------
    def check_gpio(self):
        value = lgpio.gpio_read(self.gpio_handle, INPUT_PIN)

        if value == 1 and not self.sensor_active:
            self.sensor_active = True
            self.get_logger().info("GPIO sensor triggered → STOP + LOG")
            self.log_to_mongo()

        elif value == 0 and self.sensor_active:
            self.sensor_active = False
            self.mongo_logged = False
            self.get_logger().info("GPIO sensor cleared → RESUME")

    # -----------------------------
    # COLOR IMAGE CALLBACK
    # -----------------------------
    def color_callback(self, msg):
        try:
            frame = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
            self.latest_color = frame.copy()
        except Exception as e:
            self.get_logger().error(f"Color conversion error: {e}")

    # -----------------------------
    # DEPTH WALL DETECTION
    # -----------------------------
    def depth_callback(self, msg):
        depth = self.bridge.imgmsg_to_cv2(msg, desired_encoding='passthrough')
        h, w = depth.shape

        d = depth[h//2, w//2] / 1000.0  # mm → meters

        if 0 < d < THRESHOLD and not self.sensor_active:
            self.sensor_active = True
            self.get_logger().info(f"Wall detected at {d:.2f}m → STOP + LOG")
            self.log_to_mongo()

        elif d >= THRESHOLD and self.sensor_active:
            self.sensor_active = False
            self.mongo_logged = False
            self.get_logger().info("Wall cleared → RESUME")

    # -----------------------------
    # MONGO LOGGING (with COLOR image)
    # -----------------------------
    def log_to_backend(self):
        response = requests.post(url, json=data)

    # -----------------------------
    # CLEANUP
    # -----------------------------
    def cleanup(self):
        try:
            lgpio.gpiochip_close(self.gpio_handle)
        except Exception as e:
            self.get_logger().warn(f"GPIO cleanup error: {e}")


def main():
    rclpy.init()
    node = IntegratedMover()

    try:
        rclpy.spin(node)
    finally:
        node.cleanup()
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
