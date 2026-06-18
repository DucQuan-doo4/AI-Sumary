from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth.permissions import is_admin, is_management_user
from app.meetings.meeting_service import get_meeting_by_id
from app.meetings.models import Meeting, MeetingParticipant
from app.notifications.notification_service import create_task_assigned_notification
from app.tasks.models import Task, TaskPriority, TaskStatus
from app.tasks.schemas import MeetingTaskBulkCreate, TaskCreate, TaskUpdate
from app.users.models import User, UserRole


def _validate_assignee(db: Session, meeting_id: int, assignee_id: int | None) -> User | None:
    if assignee_id is None:
        return None
    user = db.query(User).filter(User.id == assignee_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignee user does not exist",
        )
    is_participant = (
        db.query(MeetingParticipant)
        .filter(MeetingParticipant.meeting_id == meeting_id, MeetingParticipant.user_id == assignee_id)
        .first()
        is not None
    )
    if not is_participant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignee must be a participant of the meeting",
        )
    return user


def _user_display_name(user: User | None) -> str | None:
    if user is None:
        return None
    return user.full_name or user.email


def _accessible_meeting_ids_query(db: Session, current_user: User):
    query = db.query(Meeting.id)
    if is_management_user(current_user):
        return query
    return query.outerjoin(MeetingParticipant, MeetingParticipant.meeting_id == Meeting.id).filter(
        or_(
            Meeting.created_by == current_user.id,
            MeetingParticipant.user_id == current_user.id,
        )
    )


def _can_manage_task(task: Task, current_user: User) -> bool:
    return is_management_user(current_user) or task.created_by == current_user.id


def _can_update_task_status(task: Task, current_user: User) -> bool:
    return _can_manage_task(task, current_user) or task.assignee_id == current_user.id


def _assert_can_manage_task(task: Task, current_user: User) -> None:
    if not _can_manage_task(task, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ADMIN, MANAGER, or task creator can update this task",
        )


def _assert_can_delete_task(task: Task, current_user: User) -> None:
    if is_admin(current_user):
        return
    if current_user.role == UserRole.MANAGER and task.status in [TaskStatus.DONE, TaskStatus.CANCELLED]:
        return
    if task.created_by == current_user.id and task.status in [TaskStatus.DONE, TaskStatus.CANCELLED]:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "Only ADMIN can delete any task. MANAGER or task creator can delete "
            "DONE/CANCELLED tasks."
        ),
    )


def _apply_meeting_filters(query, category: str | None, tag: str | None):
    if category or tag:
        query = query.join(Meeting, Meeting.id == Task.meeting_id)
    if category:
        query = query.filter(Meeting.category == category)
    if tag:
        query = query.filter(Meeting.tags.ilike(f'%"{tag}"%'))
    return query


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
    assignee = _validate_assignee(db, payload.meeting_id, payload.assignee_id)

    task = Task(
        meeting_id=payload.meeting_id,
        title=payload.title,
        description=payload.description,
        assignee_id=payload.assignee_id,
        assignee_name=payload.assignee_name or _user_display_name(assignee),
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
        assignee = _validate_assignee(db, meeting_id, item.assignee_id)
        task = Task(
            meeting_id=meeting_id,
            title=item.title,
            description=item.description,
            assignee_id=item.assignee_id,
            assignee_name=item.assignee_name or _user_display_name(assignee),
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
    category: str | None = None,
    tag: str | None = None,
) -> list[Task]:
    query = db.query(Task).filter(Task.meeting_id.in_(_accessible_meeting_ids_query(db, current_user)))
    query = _apply_meeting_filters(query, category, tag)

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
    _assert_can_manage_task(task, current_user)
    update_data = payload.model_dump(exclude_unset=True)

    if "meeting_id" in update_data:
        get_meeting_by_id(db, update_data["meeting_id"], current_user)
    if "assignee_id" in update_data:
        meeting_id = update_data.get("meeting_id", task.meeting_id)
        assignee = _validate_assignee(db, meeting_id, update_data["assignee_id"])
        if assignee and not update_data.get("assignee_name"):
            update_data["assignee_name"] = _user_display_name(assignee)

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


def update_task_status(db: Session, task_id: int, task_status: TaskStatus, current_user: User) -> Task:
    task = _get_accessible_task(db, task_id, current_user)
    if not _can_update_task_status(task, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ADMIN, MANAGER, task creator, or assignee can update task status",
        )
    task.status = task_status
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int, current_user: User) -> None:
    task = _get_accessible_task(db, task_id, current_user)
    _assert_can_delete_task(task, current_user)
    db.delete(task)
    db.commit()
