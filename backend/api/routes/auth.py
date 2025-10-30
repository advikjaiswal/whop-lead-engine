from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime
from loguru import logger

from config.database import get_db
from models.user import User
from schemas.auth import UserCreate, UserLogin, UserResponse, Token, UserUpdate
from utils.auth import (
    authenticate_user, 
    create_access_token, 
    get_password_hash, 
    get_current_active_user
)
from utils.exceptions import AuthenticationError, ConflictError

router = APIRouter()
security = HTTPBearer()


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise ConflictError("Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        whop_community_name=user_data.whop_community_name,
        is_active=True,
        is_verified=False  # TODO: Implement email verification
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    logger.info(f"New user registered: {user.email}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise AuthenticationError("Incorrect email or password")
    
    if not user.is_active:
        raise AuthenticationError("Account is deactivated")
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    logger.info(f"User logged in: {user.email}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    if user_update.whop_community_name is not None:
        current_user.whop_community_name = user_update.whop_community_name
    
    if user_update.whop_api_key is not None:
        # TODO: Encrypt the API key before storing
        current_user.whop_api_key = user_update.whop_api_key
    
    db.commit()
    db.refresh(current_user)
    
    logger.info(f"User updated profile: {current_user.email}")
    
    return UserResponse.from_orm(current_user)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """Logout user (client-side token removal)"""
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Successfully logged out"}


@router.post("/verify-token")
async def verify_token(current_user: User = Depends(get_current_active_user)):
    """Verify if the provided token is valid"""
    return {"valid": True, "user": UserResponse.from_orm(current_user)}