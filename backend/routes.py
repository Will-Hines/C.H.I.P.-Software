from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from bson import ObjectId

from database import current_alerts_collection, previous_alerts_collection
import models

router = APIRouter()

@router.post("/robot-data")
def receive_robot_data(data: models.RobotData):
    payload = data.dict()

    if not payload.get("timestamp"):
        payload["timestamp"] = datetime.now(timezone.utc)

    current_alerts_collection.insert_one(payload)
    return {"status": "saved"}

@router.get("/robot-data")
def get_robot_data():
    docs = list(current_alerts_collection.find().sort("timestamp", -1).limit(50))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs

@router.get("/previous-alerts")
def get_previous_alerts():
    docs = list(previous_alerts_collection.find().sort("timestamp", -1).limit(50))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs

@router.post("/dismiss-alert")
def dismiss_alert(alert: dict):
    alert_id = alert.get("_id")

    if not alert_id:
        raise HTTPException(status_code=400, detail="Missing _id")

    existing_alert = current_alerts_collection.find_one({"_id": ObjectId(alert_id)})

    if not existing_alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    current_alerts_collection.delete_one({"_id": ObjectId(alert_id)})

    existing_alert["dismissed_at"] = datetime.now(timezone.utc)
    previous_alerts_collection.insert_one(existing_alert)

    return {"status": "moved to previous alerts"}
