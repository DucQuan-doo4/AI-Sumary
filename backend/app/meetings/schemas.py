from datetime import datetime

from pydantic import BaseModel, Field


class MeetingBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    content: str | None = None
    meeting_date: datetime | None = None
    participant_user_ids: list[int] = Field(default_factory=list)


class MeetingCreate(MeetingBase):
    pass


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    content: str | None = None
    summary: str | None = None
    meeting_date: datetime | None = None
    participant_user_ids: list[int] | None = None


class MeetingParticipantResponse(BaseModel):
    user_id: int

    model_config = {"from_attributes": True}


class MeetingResponse(BaseModel):
    id: int
    title: str
    description: str | None
    content: str | None
    summary: str | None
    meeting_date: datetime | None
    created_by: int
    participant_user_ids: list[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
