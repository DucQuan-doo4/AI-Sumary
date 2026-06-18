from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.meetings import meeting_service
from app.meetings.schemas import MeetingCreate, MeetingResponse, MeetingUpdate
from app.users.models import User


router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = meeting_service.create_meeting(db, payload, current_user)
    return meeting_service.serialize_meeting(meeting)


@router.get("", response_model=list[MeetingResponse])
def list_meetings(
    category: str | None = None,
    tag: str | None = None,
    search: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meetings = meeting_service.get_meetings(db, current_user, category=category, tag=tag, search=search)
    return [meeting_service.serialize_meeting(meeting) for meeting in meetings]


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = meeting_service.get_meeting_by_id(db, meeting_id, current_user)
    return meeting_service.serialize_meeting(meeting)


@router.put("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: int,
    payload: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = meeting_service.update_meeting(db, meeting_id, payload, current_user)
    return meeting_service.serialize_meeting(meeting)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting_service.delete_meeting(db, meeting_id, current_user)
    return None
