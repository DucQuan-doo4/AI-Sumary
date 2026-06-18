from datetime import date

from pydantic import BaseModel

from app.tasks.models import TaskPriority, TaskStatus


class DashboardOverview(BaseModel):
    total_meetings: int
    total_tasks: int
    todo_tasks: int
    in_progress_tasks: int
    done_tasks: int
    cancelled_tasks: int
    overdue_tasks: int


class TasksByStatusItem(BaseModel):
    status: TaskStatus
    count: int


class TasksByUserItem(BaseModel):
    assignee_id: int | None
    assignee_name: str | None
    count: int


class DashboardTaskItem(BaseModel):
    id: int
    meeting_id: int
    title: str
    assignee_id: int | None
    assignee_name: str | None
    deadline: date | None
    priority: TaskPriority
    status: TaskStatus

    model_config = {"from_attributes": True}
