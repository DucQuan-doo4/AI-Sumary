from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.notifications.models import Notification
from app.tasks.models import Task
from app.users.models import User


def create_task_assigned_notification(db: Session, task: Task) -> Notification | None:
    if task.assignee_id is None:
        return None

    notification = Notification(
        user_id=task.assignee_id,
        task_id=task.id,
        title="New task assigned",
        message=f'You have been assigned task "{task.title}".',
    )
    db.add(notification)
    return notification


def get_notifications(db: Session, current_user: User) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


def mark_notification_read(db: Session, notification_id: int, current_user: User) -> Notification:
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification
