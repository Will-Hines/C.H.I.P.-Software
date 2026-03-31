import requests

# your local backend URL
url = "https://c-h-i-p-software.onrender.com/robot-data"


# example robot data
data = {
    "robot_id": "R1",
    "battery": 88.5,
    "temperature": 31.2,
    "speed": 2.6
}

response = requests.post(url, json=data)
print(response.json())  # should print: {"status": "saved"}
