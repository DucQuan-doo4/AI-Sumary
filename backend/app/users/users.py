from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.permissions import is_admin
from app.auth.security import get_password_hash
from app.database import get_db
from app.users.models import User
from app.users.schemas import UserCreateAdmin, UserListItem, UserProfileUpdate, UserResponse


router = APIRouter(prefix="/users", tags=["users"])
AVATAR_DIR = Path("uploads/avatars")
ALLOWED_AVATAR_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _require_admin(current_user: User) -> None:
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ADMIN permission required")


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("", response_model=list[UserListItem])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(User).filter(User.is_active.is_(True)).order_by(User.full_name.asc(), User.email.asc()).all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        department=payload.department,
        room=payload.room,
        personal_info=payload.personal_info,
        education=payload.education,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me/profile", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me/avatar", response_model=UserResponse)
async def update_my_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    extension = ALLOWED_AVATAR_TYPES.get(file.content_type or "")
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar must be a JPG, PNG, or WebP image",
        )

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Avatar must be 2MB or smaller")

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"user-{current_user.id}-{uuid4().hex}{extension}"
    path = AVATAR_DIR / filename
    path.write_bytes(content)

    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}/profile", response_model=UserResponse)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return _get_user_or_404(db, user_id)


@router.patch("/{user_id}/profile", response_model=UserResponse)
def update_user_profile(
    user_id: int,
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    user = _get_user_or_404(db, user_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
