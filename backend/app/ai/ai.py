from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai.ai_service import analyze_meeting
from app.ai.schemas import AiAnalyzeResponse
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.users.models import User


router = APIRouter(tags=["ai"])


@router.post("/meetings/{meeting_id}/analyze", response_model=AiAnalyzeResponse)
def analyze_meeting_endpoint(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analyze_meeting(db, meeting_id, current_user)
