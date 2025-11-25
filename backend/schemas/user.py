from pydantic import BaseModel, field_validator

class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreate(UserBase):
    password: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v or '.' not in v.split('@')[-1]:
            raise ValueError('Invalid email format')
        return v.lower()

class UserLogin(BaseModel):
    email: str
    password: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v or '.' not in v.split('@')[-1]:
            raise ValueError('Invalid email format')
        return v.lower()

class UserInDB(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
