from pydantic import BaseModel
from datetime import datetime

class RobotData(BaseModel):
    robot_id: str
    temperature: float
    battery: float
    location: str
    timestamp: datetime
