from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

app = FastAPI()

# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # change * to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)
