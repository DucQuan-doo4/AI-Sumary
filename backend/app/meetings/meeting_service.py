from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.meetings.models import Meeting, MeetingParticipant
from app.meetings.schemas import MeetingCreate, MeetingUpdate
from app.users.models import User


def _unique_participant_ids(participant_user_ids: list[int], created_by: int) -> list[int]:
    return sorted(set(participant_user_ids + [created_by]))


def _validate_users_exist(db: Session, user_ids: list[int]) -> None:
    if not user_ids:
        return
    existing_count = db.query(User).filter(User.id.in_(user_ids)).count()
    if existing_count != len(set(user_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more participant users do not exist",
        )


def _set_participants(db: Session, meeting: Meeting, participant_user_ids: list[int]) -> None:
    meeting.participants.clear()
    db.flush()
    for user_id in participant_user_ids:
        meeting.participants.append(MeetingParticipant(user_id=user_id))


def serialize_meeting(meeting: Meeting) -> dict:
    return {
        "id": meeting.id,
        "title": meeting.title,
        "description": meeting.description,
        "content": meeting.content,
        "summary": meeting.summary,
        "meeting_date": meeting.meeting_date,
        "created_by": meeting.created_by,
        "participant_user_ids": [participant.user_id for participant in meeting.participants],
        "created_at": meeting.created_at,
        "updated_at": meeting.updated_at,
    }


def create_meeting(db: Session, payload: MeetingCreate, current_user: User) -> Meeting:
    participant_ids = _unique_participant_ids(payload.participant_user_ids, current_user.id)
    _validate_users_exist(db, participant_ids)

    meeting = Meeting(
        title=payload.title,
        description=payload.description,
        content=payload.content,
        meeting_date=payload.meeting_date,
        created_by=current_user.id,
    )
    db.add(meeting)
    db.flush()
    _set_participants(db, meeting, participant_ids)
    db.commit()
    db.refresh(meeting)
    return get_meeting_by_id(db, meeting.id, current_user)


def get_meetings(db: Session, current_user: User) -> list[Meeting]:
    return (
        db.query(Meeting)
        .options(selectinload(Meeting.participants))
        .filter(
            (Meeting.created_by == current_user.id)
            | (Meeting.participants.any(MeetingParticipant.user_id == current_user.id))
        )
        .order_by(Meeting.created_at.desc())
        .all()
    )


def get_meeting_by_id(db: Session, meeting_id: int, current_user: User) -> Meeting:
    meeting = (
        db.query(Meeting)
        .options(selectinload(Meeting.participants))
        .filter(Meeting.id == meeting_id)
        .first()
    )
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    is_creator = meeting.created_by == current_user.id
    is_participant = any(participant.user_id == current_user.id for participant in meeting.participants)
    if not is_creator and not is_participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return meeting


def update_meeting(db: Session, meeting_id: int, payload: MeetingUpdate, current_user: User) -> Meeting:
    meeting = get_meeting_by_id(db, meeting_id, current_user)
    if meeting.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only creator can update meeting")

    update_data = payload.model_dump(exclude_unset=True)
    participant_user_ids = update_data.pop("participant_user_ids", None)
    for field, value in update_data.items():
        setattr(meeting, field, value)

    if participant_user_ids is not None:
        participant_ids = _unique_participant_ids(participant_user_ids, current_user.id)
        _validate_users_exist(db, participant_ids)
        _set_participants(db, meeting, participant_ids)

    db.commit()
    return get_meeting_by_id(db, meeting_id, current_user)


def delete_meeting(db: Session, meeting_id: int, current_user: User) -> None:
    meeting = get_meeting_by_id(db, meeting_id, current_user)
    if meeting.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only creator can delete meeting")
    db.delete(meeting)
    db.commit()
