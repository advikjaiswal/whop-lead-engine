from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"message": "Railway Test with CORS and Pydantic"}

@app.post("/simple-signup")
async def signup(data: SignupRequest):
    """Working signup endpoint with Pydantic model"""
    user_id = f"user_{hash(data.email) % 100000}"
    token = f"railway_token_{user_id}_{int(time.time())}"
    
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": data.email,
            "full_name": data.full_name
        }
    }