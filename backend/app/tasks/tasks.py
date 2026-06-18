from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.tasks import task_service
from app.tasks.models import TaskPriority, TaskStatus
from app.tasks.schemas import (
    MeetingTaskBulkCreate,
    TaskCreate,
    TaskResponse,
    TaskStatusUpdate,
    TaskUpdate,
)
from app.users.models import User


router = APIRouter(tags=["tasks"])


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return task_service.create_task(db, payload, current_user)


@router.post(
    "/meetings/{meeting_id}/tasks/bulk",
    response_model=list[TaskResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_meeting_tasks_bulk(
    meeting_id: int,
    payload: MeetingTaskBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return task_service.create_meeting_tasks_bulk(db, meeting_id, payload, current_user)


@router.get("/tasks", response_model=list[TaskResponse])
def list_tasks(
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    priority: TaskPriority | None = None,
    assignee_id: int | None = None,
    meeting_id: int | None = None,
    overdue: bool | None = None,
    category: str | None = None,
    tag: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return task_service.get_tasks(
        db=db,
        current_user=current_user,
        task_status=status_filter,
        priority=priority,
        assignee_id=assignee_id,
        meeting_id=meeting_id,
        overdue=overdue,
        category=category,
        tag=tag,
    )


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return task_service.get_task_by_id(db, task_id, current_user)


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return task_service.update_task(db, task_id, payload, current_user)


@router.patch("/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return task_service.update_task_status(db, task_id, payload.status, current_user)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task_service.delete_task(db, task_id, current_user)
    return None
