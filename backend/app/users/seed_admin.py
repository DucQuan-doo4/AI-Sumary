from sqlalchemy.orm import Session

from app.auth.security import get_password_hash
from app.config import get_settings
from app.database import SessionLocal
from app.users.models import User, UserRole


def seed_admin(db: Session) -> User:
    settings = get_settings()
    existing_admin = db.query(User).filter(User.email == settings.default_admin_email).first()
    if existing_admin:
        return existing_admin

    admin = User(
        email=settings.default_admin_email,
        full_name=settings.default_admin_full_name,
        hashed_password=get_password_hash(settings.default_admin_password),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def main() -> None:
    db = SessionLocal()
    try:
        admin = seed_admin(db)
        print(f"Admin user ready: {admin.email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
