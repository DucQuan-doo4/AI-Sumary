from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.meetings.meeting_service import get_meeting_by_id
from app.meetings.models import Meeting, MeetingParticipant
from app.notifications.notification_service import create_task_assigned_notification
from app.tasks.models import Task, TaskPriority, TaskStatus
from app.tasks.schemas import MeetingTaskBulkCreate, TaskCreate, TaskUpdate
from app.users.models import User


def _validate_assignee(db: Session, assignee_id: int | None) -> None:
    if assignee_id is None:
        return
    user = db.query(User).filter(User.id == assignee_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignee user does not exist",
        )


def _accessible_meeting_ids_query(db: Session, current_user: User):
    return (
        db.query(Meeting.id)
        .outerjoin(MeetingParticipant, MeetingParticipant.meeting_id == Meeting.id)
        .filter(
            or_(
                Meeting.created_by == current_user.id,
                MeetingParticipant.user_id == current_user.id,
            )
        )
    )


def _get_accessible_task(db: Session, task_id: int, current_user: User) -> Task:
    task = (
        db.query(Task)
        .filter(
            Task.id == task_id,
            Task.meeting_id.in_(_accessible_meeting_ids_query(db, current_user)),
        )
        .first()
    )
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


def create_task(db: Session, payload: TaskCreate, current_user: User) -> Task:
    get_meeting_by_id(db, payload.meeting_id, current_user)
    _validate_assignee(db, payload.assignee_id)

    task = Task(
        meeting_id=payload.meeting_id,
        title=payload.title,
        description=payload.description,
        assignee_id=payload.assignee_id,
        assignee_name=payload.assignee_name,
        deadline=payload.deadline,
        priority=payload.priority,
        status=payload.status,
        source=payload.source,
        created_by=current_user.id,
    )
    db.add(task)
    db.flush()
    create_task_assigned_notification(db, task)
    db.commit()
    db.refresh(task)
    return task


def create_meeting_tasks_bulk(
    db: Session,
    meeting_id: int,
    payload: MeetingTaskBulkCreate,
    current_user: User,
) -> list[Task]:
    get_meeting_by_id(db, meeting_id, current_user)

    tasks: list[Task] = []
    for item in payload.tasks:
        _validate_assignee(db, item.assignee_id)
        task = Task(
            meeting_id=meeting_id,
            title=item.title,
            description=item.description,
            assignee_id=item.assignee_id,
            assignee_name=item.assignee_name,
            deadline=item.deadline,
            priority=item.priority,
            status=item.status,
            source=item.source,
            created_by=current_user.id,
        )
        db.add(task)
        db.flush()
        create_task_assigned_notification(db, task)
        tasks.append(task)

    db.commit()
    for task in tasks:
        db.refresh(task)
    return tasks


def get_tasks(
    db: Session,
    current_user: User,
    task_status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    assignee_id: int | None = None,
    meeting_id: int | None = None,
    overdue: bool | None = None,
) -> list[Task]:
    query = db.query(Task).filter(Task.meeting_id.in_(_accessible_meeting_ids_query(db, current_user)))

    if task_status is not None:
        query = query.filter(Task.status == task_status)
    if priority is not None:
        query = query.filter(Task.priority == priority)
    if assignee_id is not None:
        query = query.filter(Task.assignee_id == assignee_id)
    if meeting_id is not None:
        get_meeting_by_id(db, meeting_id, current_user)
        query = query.filter(Task.meeting_id == meeting_id)
    if overdue is True:
        query = query.filter(
            Task.deadline < date.today(),
            Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED]),
        )
    elif overdue is False:
        query = query.filter(
            or_(
                Task.deadline.is_(None),
                Task.deadline >= date.today(),
                Task.status.in_([TaskStatus.DONE, TaskStatus.CANCELLED]),
            )
        )

    return query.order_by(Task.created_at.desc()).all()


def get_task_by_id(db: Session, task_id: int, current_user: User) -> Task:
    return _get_accessible_task(db, task_id, current_user)


def update_task(db: Session, task_id: int, payload: TaskUpdate, current_user: User) -> Task:
    task = _get_accessible_task(db, task_id, current_user)
    update_data = payload.model_dump(exclude_unset=True)

    if "meeting_id" in update_data:
        get_meeting_by_id(db, update_data["meeting_id"], current_user)
    if "assignee_id" in update_data:
        _validate_assignee(db, update_data["assignee_id"])

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


def update_task_status(db: Session, task_id: int, task_status: TaskStatus, current_user: User) -> Task:
    task = _get_accessible_task(db, task_id, current_user)
    task.status = task_status
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int, current_user: User) -> None:
    task = _get_accessible_task(db, task_id, current_user)
    db.delete(task)
    db.commit()
