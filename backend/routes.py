from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from database import collection

router = APIRouter()

# Schema for incoming robot data
class RobotTelemetry(BaseModel):
    robot_id: str
    battery: float
    temperature: float
    speed: float

# Endpoint for robot to POST data
@router.post("/robot-data")
def receive_robot_data(data: RobotTelemetry):
    payload = data.dict()
    payload["timestamp"] = datetime.utcnow()
    collection.insert_one(payload)
    return {"status": "saved"}

# Endpoint for frontend to GET latest data
@router.get("/robot-data")
def get_robot_data():
    docs = list(collection.find().sort("timestamp", -1).limit(50))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs
