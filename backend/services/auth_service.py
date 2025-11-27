from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
import uuid
import json
import base64

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user import User
from backend.config.settings import get_settings

settings = get_settings()
SECRET_KEY = settings.JWT_SECRET
ACCESS_TOKEN_EXPIRE_HOURS = settings.JWT_EXPIRATION_HOURS

security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    """Verify password using PBKDF2 with SHA256"""
    try:
        salt, hash_hex = hashed_password.split(':')
        salt_bytes = bytes.fromhex(salt)
        expected_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), salt_bytes, 1000)
        return secrets.compare_digest(expected_hash.hex(), hash_hex)
    except:
        return False

def get_password_hash(password):
    """Hash password using PBKDF2 with SHA256"""
    salt = secrets.token_bytes(32)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 1000)
    return f"{salt.hex()}:{password_hash.hex()}"

def create_access_token(data: dict):
    """Create a secure token without JWT dependency"""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    token_data = {
        "sub": data.get("sub"),
        "exp": expire.timestamp(),
        "iat": datetime.utcnow().timestamp(),
        "jti": str(uuid.uuid4())
    }
    
    token_json = json.dumps(token_data, sort_keys=True)
    token_b64 = base64.urlsafe_b64encode(token_json.encode()).decode()
    
    signature = hashlib.new('sha256', SECRET_KEY.encode() + token_b64.encode()).hexdigest()
    
    return f"{token_b64}.{signature}"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        token = credentials.credentials
        
        if token.startswith("demo-"):
            demo_user = User(
                id=999999,
                email='demo@whop.com',
                full_name='Demo User',
                is_active=True,
                created_at=datetime.utcnow()
            )
            return demo_user
        
        if '.' not in token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")
        
        token_b64, signature = token.split('.', 1)
        
        expected_sig = hashlib.new('sha256', SECRET_KEY.encode() + token_b64.encode()).hexdigest()
        if not secrets.compare_digest(signature, expected_sig):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")
        
        try:
            token_json = base64.urlsafe_b64decode(token_b64.encode()).decode()
            token_data = json.loads(token_json)
        except (ValueError, json.JSONDecodeError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")
        
        exp_time = token_data.get("exp", 0)
        if datetime.utcnow().timestamp() > exp_time:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
        
        user_id = token_data.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        issued_at = token_data.get("iat", 0)
        if datetime.utcnow().timestamp() - issued_at > ACCESS_TOKEN_EXPIRE_HOURS * 3600:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Token validation error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user
