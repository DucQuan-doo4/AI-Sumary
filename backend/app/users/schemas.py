from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.users.models import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRole = UserRole.MEMBER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
