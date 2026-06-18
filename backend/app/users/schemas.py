from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.users.models import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRole = UserRole.MEMBER


class UserCreateAdmin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRole = UserRole.MEMBER
    department: str | None = Field(default=None, max_length=255)
    room: str | None = Field(default=None, max_length=255)
    personal_info: str | None = Field(default=None, max_length=2000)
    education: str | None = Field(default=None, max_length=2000)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRole | None = None
    department: str | None = Field(default=None, max_length=255)
    room: str | None = Field(default=None, max_length=255)
    personal_info: str | None = Field(default=None, max_length=2000)
    education: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class UserListItem(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None
    avatar_url: str | None
    department: str | None
    room: str | None
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None
    avatar_url: str | None
    department: str | None
    room: str | None
    personal_info: str | None
    education: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
