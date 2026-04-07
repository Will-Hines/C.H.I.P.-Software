import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)

db = client["Robot_1"]            # database name
current_alerts_collection = db["Current_Alerts"]
previous_alerts_collection = db["Previous_Alerts"]
