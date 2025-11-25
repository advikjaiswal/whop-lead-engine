from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import re
import time

from backend.database import get_db
from backend.models.user import User
from backend.schemas.user import UserCreate, UserLogin
from backend.schemas.token import Token
from backend.services.auth_service import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter()

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    
    if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)', user.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter, one lowercase letter, and one number")
    
    if len(user.full_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters long")
    
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email.strip().lower(),
            full_name=user.full_name.strip(),
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        access_token = create_access_token(data={"sub": str(db_user.id)})
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    except Exception as e:
        db.rollback()
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user account")

@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(
            User.email == user.email.strip().lower(),
            User.is_active == True
        ).first()
        
        if not db_user:
            time.sleep(0.1)
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not verify_password(user.password, db_user.hashed_password):
            time.sleep(0.1)
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access_token = create_access_token(data={"sub": str(db_user.id)})
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at
    }
