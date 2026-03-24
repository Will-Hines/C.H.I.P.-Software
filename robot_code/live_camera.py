#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import cv2
import numpy as np

DEPTH_TOPIC = "/camera/camera/depth/image_rect_raw"

class DepthViewer(Node):
    def __init__(self):
        super().__init__('depth_viewer')

        self.bridge = CvBridge()

        self.sub = self.create_subscription(
            Image,
            DEPTH_TOPIC,
            self.depth_callback,
            10
        )

        self.get_logger().info("Depth viewer started. Listening to %s" % DEPTH_TOPIC)

    def depth_callback(self, msg):
        try:
            depth = self.bridge.imgmsg_to_cv2(msg, desired_encoding='passthrough')

            # Normalize depth for display
            depth_norm = cv2.normalize(depth, None, 0, 255, cv2.NORM_MINMAX)
            depth_norm = depth_norm.astype(np.uint8)

            cv2.imshow("RealSense Depth Stream", depth_norm)
            cv2.waitKey(1)

        except Exception as e:
            self.get_logger().error(f"Depth conversion error: {e}")

def main():
    rclpy.init()
    node = DepthViewer()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        cv2.destroyAllWindows()
        node.destroy_node()
        rclpy.shutdown()

if __name__ == "__main__":
    main()
