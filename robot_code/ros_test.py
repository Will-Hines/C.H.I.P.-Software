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
# MONGO CONFIG
# -----------------------------
uri = "mongodb+srv://db_user:mongo@spill-detection-cluster.tfmvn7s.mongodb.net/?appName=spill-detection-cluster"
client = MongoClient(uri)
db = client["spill-detection-cluster"]
mycol = db["Test"]


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
    def log_to_mongo(self):
        if self.mongo_logged:
            return

        try:
            client.admin.command('ping')

            img_b64 = None
            if self.latest_color is not None:
                # Save to Pi
                timestamp = int(time.time())
                filename = f"/home/chip/captured_{timestamp}.jpg"
                cv2.imwrite(filename, self.latest_color)
                self.get_logger().info(f"Saved image to {filename}")

                # Encode for MongoDB
                _, jpeg = cv2.imencode(".jpg", self.latest_color)
                img_b64 = base64.b64encode(jpeg.tobytes()).decode("utf-8")
            doc = {
                "trigger": True,
                "timestamp": time.time(),
                "color_image_jpeg_base64": img_b64
            }

            mycol.insert_one(doc)
            self.get_logger().info("MongoDB document inserted (with COLOR image).")
            self.mongo_logged = True

        except Exception as e:
            self.get_logger().error(f"MongoDB error: {e}")

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
