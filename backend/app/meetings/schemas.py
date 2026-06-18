from datetime import datetime

from pydantic import BaseModel, Field

from app.users.models import UserRole


class MeetingBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    content: str | None = None
    category: str | None = Field(default=None, max_length=100)
    tags: list[str] = Field(default_factory=list)
    meeting_date: datetime | None = None
    participant_user_ids: list[int] = Field(default_factory=list)


class MeetingCreate(MeetingBase):
    pass


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    content: str | None = None
    summary: str | None = None
    category: str | None = Field(default=None, max_length=100)
    tags: list[str] | None = None
    meeting_date: datetime | None = None
    participant_user_ids: list[int] | None = None


class MeetingParticipantResponse(BaseModel):
    user_id: int

    model_config = {"from_attributes": True}


class MeetingParticipantUserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    role: UserRole


class MeetingResponse(BaseModel):
    id: int
    title: str
    description: str | None
    content: str | None
    summary: str | None
    category: str | None
    tags: list[str]
    meeting_date: datetime | None
    created_by: int
    participant_user_ids: list[int]
    participants: list[MeetingParticipantUserResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
