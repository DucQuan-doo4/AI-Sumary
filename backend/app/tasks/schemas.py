from datetime import date, datetime

from pydantic import BaseModel, Field

from app.tasks.models import TaskPriority, TaskSource, TaskStatus
from app.users.models import UserRole


class TaskBase(BaseModel):
    meeting_id: int
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    assignee_id: int | None = None
    assignee_name: str | None = Field(default=None, max_length=255)
    deadline: date | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    source: TaskSource = TaskSource.MANUAL


class TaskCreate(TaskBase):
    pass


class MeetingTaskBulkItem(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    assignee_id: int | None = None
    assignee_name: str | None = Field(default=None, max_length=255)
    deadline: date | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    source: TaskSource = TaskSource.MANUAL


class MeetingTaskBulkCreate(BaseModel):
    tasks: list[MeetingTaskBulkItem] = Field(min_length=1)


class TaskUpdate(BaseModel):
    meeting_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    assignee_id: int | None = None
    assignee_name: str | None = Field(default=None, max_length=255)
    deadline: date | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    source: TaskSource | None = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskUserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    avatar_url: str | None
    department: str | None
    room: str | None
    role: UserRole

    model_config = {"from_attributes": True}


class TaskResponse(BaseModel):
    id: int
    meeting_id: int
    title: str
    description: str | None
    assignee_id: int | None
    assignee_name: str | None
    assignee: TaskUserResponse | None
    deadline: date | None
    priority: TaskPriority
    status: TaskStatus
    source: TaskSource
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
