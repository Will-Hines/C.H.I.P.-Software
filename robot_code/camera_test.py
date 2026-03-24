#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
import numpy as np
from cv_bridge import CvBridge

THRESHOLD = 0.5  # meters

class WallDetector(Node):
    def __init__(self):
        super().__init__('wall_detector')
        self.bridge = CvBridge()
        self.sub = self.create_subscription(
            Image,
            '/camera/camera/depth/image_rect_raw',
            self.depth_callback,
            10
        )

    def depth_callback(self, msg):
        depth = self.bridge.imgmsg_to_cv2(msg, desired_encoding='passthrough')
        h, w = depth.shape
        d = depth[h//2, w//2] / 1000.0  # mm → meters

        print(1 if 0 < d < THRESHOLD else 0)

def main():
    rclpy.init()
    node = WallDetector()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()

