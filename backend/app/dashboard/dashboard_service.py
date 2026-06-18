from datetime import date, timedelta

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth.permissions import is_management_user
from app.meetings.models import Meeting, MeetingParticipant
from app.tasks.models import Task, TaskStatus
from app.users.models import User


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


def _apply_meeting_filters(query, category: str | None = None, tag: str | None = None):
    if category or tag:
        query = query.join(Meeting, Meeting.id == Task.meeting_id)
    if category:
        query = query.filter(Meeting.category == category)
    if tag:
        query = query.filter(Meeting.tags.ilike(f'%"{tag}"%'))
    return query


def _accessible_tasks_query(db: Session, current_user: User, category: str | None = None, tag: str | None = None):
    query = db.query(Task).filter(Task.meeting_id.in_(_accessible_meeting_ids_query(db, current_user)))
    return _apply_meeting_filters(query, category, tag)


def _overdue_filter():
    return (
        Task.deadline < date.today(),
        Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED]),
    )


def get_overview(db: Session, current_user: User, category: str | None = None, tag: str | None = None) -> dict:
    meetings_query = db.query(Meeting).filter(Meeting.id.in_(_accessible_meeting_ids_query(db, current_user)))
    if category:
        meetings_query = meetings_query.filter(Meeting.category == category)
    if tag:
        meetings_query = meetings_query.filter(Meeting.tags.ilike(f'%"{tag}"%'))
    tasks_query = _accessible_tasks_query(db, current_user, category, tag)

    return {
        "total_meetings": meetings_query.count(),
        "total_tasks": tasks_query.count(),
        "todo_tasks": tasks_query.filter(Task.status == TaskStatus.TODO).count(),
        "in_progress_tasks": tasks_query.filter(Task.status == TaskStatus.IN_PROGRESS).count(),
        "done_tasks": tasks_query.filter(Task.status == TaskStatus.DONE).count(),
        "cancelled_tasks": tasks_query.filter(Task.status == TaskStatus.CANCELLED).count(),
        "overdue_tasks": tasks_query.filter(*_overdue_filter()).count(),
    }


def get_tasks_by_status(db: Session, current_user: User, category: str | None = None, tag: str | None = None) -> list[dict]:
    counts = {
        status: 0
        for status in [
            TaskStatus.TODO,
            TaskStatus.IN_PROGRESS,
            TaskStatus.DONE,
            TaskStatus.CANCELLED,
        ]
    }
    rows = (
        _accessible_tasks_query(db, current_user, category, tag)
        .with_entities(Task.status, func.count(Task.id))
        .group_by(Task.status)
        .all()
    )
    for task_status, count in rows:
        counts[task_status] = count
    return [{"status": task_status, "count": count} for task_status, count in counts.items()]


def get_tasks_by_user(db: Session, current_user: User, category: str | None = None, tag: str | None = None) -> list[dict]:
    rows = (
        _accessible_tasks_query(db, current_user, category, tag)
        .with_entities(Task.assignee_id, Task.assignee_name, func.count(Task.id))
        .group_by(Task.assignee_id, Task.assignee_name)
        .order_by(func.count(Task.id).desc())
        .all()
    )
    return [
        {"assignee_id": assignee_id, "assignee_name": assignee_name, "count": count}
        for assignee_id, assignee_name, count in rows
    ]


def get_overdue_tasks(db: Session, current_user: User, category: str | None = None, tag: str | None = None) -> list[Task]:
    return (
        _accessible_tasks_query(db, current_user, category, tag)
        .filter(*_overdue_filter())
        .order_by(Task.deadline.asc(), Task.created_at.desc())
        .all()
    )


def get_upcoming_deadlines(db: Session, current_user: User, category: str | None = None, tag: str | None = None) -> list[Task]:
    today = date.today()
    next_week = today + timedelta(days=7)
    return (
        _accessible_tasks_query(db, current_user, category, tag)
        .filter(
            Task.deadline >= today,
            Task.deadline <= next_week,
            Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED]),
        )
        .order_by(Task.deadline.asc(), Task.created_at.desc())
        .all()
    )
