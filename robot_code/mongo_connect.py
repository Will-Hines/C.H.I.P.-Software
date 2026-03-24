from pymongo import MongoClient

# Connection configuration
# Note: In PyMongo 3.11, the "appName" parameter in the URI is still supported
uri = "mongodb+srv://db_user:mongo@spill-detection-cluster.tfmvn7s.mongodb.net/?appName=spill-detection-cluster"
drew = {'testing' : '123'}

# Create a new client
# Removed: server_api=ServerApi('1') as it is not supported in 3.11
client = MongoClient(uri)

db = client["spill-detection-cluster"]
mycol = db["Test"]

try:
    # Send a ping to confirm a successful connection
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
    
    # Insert the document
    mycol.insert_one(drew)
    print("Document inserted successfully.")
    
except Exception as e:
    print(f"An error occurred: {e}")