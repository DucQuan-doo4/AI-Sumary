from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.notifications.notification_service import get_notifications, mark_notification_read
from app.notifications.schemas import NotificationResponse
from app.users.models import User


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_notifications(db, current_user)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return mark_notification_read(db, notification_id, current_user)
