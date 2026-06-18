from datetime import date

from pydantic import BaseModel, Field

from app.tasks.models import TaskPriority


class AiSuggestedTask(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    assignee_name: str | None = None
    deadline: date | None = None
    priority: TaskPriority = TaskPriority.MEDIUM


class AiAnalyzeResponse(BaseModel):
    summary: str
    tasks: list[AiSuggestedTask]
