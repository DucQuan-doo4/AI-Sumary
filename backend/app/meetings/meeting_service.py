import json

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.auth.permissions import is_management_user
from app.meetings.models import Meeting, MeetingParticipant
from app.meetings.schemas import MeetingCreate, MeetingUpdate
from app.users.models import User


def _unique_participant_ids(participant_user_ids: list[int], created_by: int) -> list[int]:
    return sorted(set(participant_user_ids + [created_by]))


def _normalize_tags(tags: list[str] | None) -> list[str]:
    if not tags:
        return []
    normalized: list[str] = []
    seen: set[str] = set()
    for tag in tags:
        clean_tag = tag.strip()
        key = clean_tag.lower()
        if clean_tag and key not in seen:
            normalized.append(clean_tag)
            seen.add(key)
    return normalized


def _dump_tags(tags: list[str] | None) -> str:
    return json.dumps(_normalize_tags(tags), ensure_ascii=False)


def _load_tags(raw_tags: str | None) -> list[str]:
    if not raw_tags:
        return []
    try:
        loaded = json.loads(raw_tags)
    except json.JSONDecodeError:
        return [tag.strip() for tag in raw_tags.split(",") if tag.strip()]
    if not isinstance(loaded, list):
        return []
    return [str(tag) for tag in loaded if str(tag).strip()]


def _validate_users_exist(db: Session, user_ids: list[int]) -> None:
    if not user_ids:
        return
    existing_count = db.query(User).filter(User.id.in_(user_ids), User.is_active.is_(True)).count()
    if existing_count != len(set(user_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more participant users do not exist or are inactive",
        )


def _set_participants(db: Session, meeting: Meeting, participant_user_ids: list[int]) -> None:
    meeting.participants.clear()
    db.flush()
    for user_id in participant_user_ids:
        meeting.participants.append(MeetingParticipant(user_id=user_id))


def serialize_meeting(meeting: Meeting) -> dict:
    participant_users = []
    for participant in meeting.participants:
        if participant.user is not None:
            participant_users.append(
                {
                    "id": participant.user.id,
                    "email": participant.user.email,
                    "full_name": participant.user.full_name,
                    "avatar_url": participant.user.avatar_url,
                    "department": participant.user.department,
                    "room": participant.user.room,
                    "role": participant.user.role,
                }
            )

    return {
        "id": meeting.id,
        "title": meeting.title,
        "description": meeting.description,
        "content": meeting.content,
        "summary": meeting.summary,
        "category": meeting.category,
        "tags": _load_tags(meeting.tags),
        "meeting_date": meeting.meeting_date,
        "created_by": meeting.created_by,
        "participant_user_ids": [participant.user_id for participant in meeting.participants],
        "participants": participant_users,
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
        category=payload.category,
        tags=_dump_tags(payload.tags),
        meeting_date=payload.meeting_date,
        created_by=current_user.id,
    )
    db.add(meeting)
    db.flush()
    _set_participants(db, meeting, participant_ids)
    db.commit()
    db.refresh(meeting)
    return get_meeting_by_id(db, meeting.id, current_user)


def get_meetings(
    db: Session,
    current_user: User,
    category: str | None = None,
    tag: str | None = None,
    search: str | None = None,
) -> list[Meeting]:
    query = (
        db.query(Meeting)
        .options(selectinload(Meeting.participants).selectinload(MeetingParticipant.user))
    )
    if not is_management_user(current_user):
        query = query.filter(
            (Meeting.created_by == current_user.id)
            | (Meeting.participants.any(MeetingParticipant.user_id == current_user.id))
        )
    if category:
        query = query.filter(Meeting.category == category)
    if tag:
        query = query.filter(Meeting.tags.ilike(f'%"{tag}"%'))
    if search:
        like_search = f"%{search}%"
        query = query.filter(or_(Meeting.title.ilike(like_search), Meeting.description.ilike(like_search)))

    return query.order_by(Meeting.created_at.desc()).all()


def get_meeting_by_id(db: Session, meeting_id: int, current_user: User) -> Meeting:
    meeting = (
        db.query(Meeting)
        .options(selectinload(Meeting.participants).selectinload(MeetingParticipant.user))
        .filter(Meeting.id == meeting_id)
        .first()
    )
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    is_creator = meeting.created_by == current_user.id
    is_participant = any(participant.user_id == current_user.id for participant in meeting.participants)
    if not is_management_user(current_user) and not is_creator and not is_participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return meeting


def update_meeting(db: Session, meeting_id: int, payload: MeetingUpdate, current_user: User) -> Meeting:
    meeting = get_meeting_by_id(db, meeting_id, current_user)
    if meeting.created_by != current_user.id and not is_management_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator, ADMIN, or MANAGER can update meeting",
        )

    update_data = payload.model_dump(exclude_unset=True)
    participant_user_ids = update_data.pop("participant_user_ids", None)
    if "tags" in update_data:
        update_data["tags"] = _dump_tags(update_data["tags"])
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
    if meeting.created_by != current_user.id and not is_management_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator, ADMIN, or MANAGER can delete meeting",
        )
    db.delete(meeting)
    db.commit()
