import requests

# your local backend URL
url = "https://c-h-i-p-software.onrender.com/robot-data"


data = {
    "robot_id": "R1",
    "battery": 88.5,
    "temperature": 31.2,
    "location": "Zone A",
    "timestamp": "2026-03-31T15:30:00-04:00",
    "image_url": "https://example.com/test.jpg"
}

response = requests.post(url, json=data)
print(response.json())  # should print: {"status": "saved"}
