from pydantic import BaseModel
from datetime import datetime

class RobotData(BaseModel):
    robot_id: str
    temperature: float
    battery: float
    image_url: str
    timestamp: str
