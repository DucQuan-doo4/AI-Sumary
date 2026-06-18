import json
import re

from fastapi import HTTPException, status
from google import genai
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.ai.models import AiLog
from app.ai.schemas import AiAnalyzeResponse
from app.config import get_settings
from app.meetings.meeting_service import get_meeting_by_id
from app.users.models import User


def _mock_analyze(content: str, meeting_date: str | None) -> dict:
    return {
        "summary": "Mock summary: meeting content was analyzed successfully.",
        "tasks": [
            {
                "title": "Review meeting notes",
                "description": "Review the meeting content and confirm key action items.",
                "assignee_name": None,
                "deadline": meeting_date[:10] if meeting_date else None,
                "priority": "MEDIUM",
            },
            {
                "title": "Follow up with participants",
                "description": "Send a follow-up message to confirm owners and deadlines.",
                "assignee_name": None,
                "deadline": None,
                "priority": "HIGH",
            },
        ],
    }


def _strip_markdown_json(raw_text: str) -> str:
    text = raw_text.strip()
    fence_match = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.DOTALL | re.IGNORECASE)
    if fence_match:
        return fence_match.group(1).strip()
    return text


def _parse_ai_json(raw_text: str) -> AiAnalyzeResponse:
    cleaned_text = _strip_markdown_json(raw_text)
    try:
        parsed = json.loads(cleaned_text)
    except json.JSONDecodeError as exc:
        raise ValueError("AI response is not valid JSON") from exc

    try:
        return AiAnalyzeResponse.model_validate(parsed)
    except ValidationError as exc:
        raise ValueError(f"AI response does not match expected format: {exc}") from exc


def _build_prompt(content: str, meeting_date: str | None) -> str:
    payload = {
        "meeting_date": meeting_date,
        "meeting_content": content,
        "required_output": {
            "summary": "A concise meeting summary in the same language as the meeting content.",
            "tasks": [
                {
                    "title": "Short task title",
                    "description": "Clear task description or null",
                    "assignee_name": "Detected assignee name or null",
                    "deadline": "YYYY-MM-DD or null",
                    "priority": "LOW | MEDIUM | HIGH",
                }
            ],
        },
    }
    return (
        "Analyze the meeting content and extract follow-up action items. "
        "Return only valid JSON. Do not include markdown fences or commentary. "
        "If a field is unknown, use null. "
        "Priority must be LOW, MEDIUM, or HIGH.\n\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )


def _call_vertex_ai(content: str, meeting_date: str | None) -> AiAnalyzeResponse:
    settings = get_settings()
    if not settings.gcp_project_id:
        raise ValueError("GCP_PROJECT_ID is required when USE_MOCK_AI=false and AI_PROVIDER=vertexai")
    if not settings.gcp_location:
        raise ValueError("GCP_LOCATION is required when USE_MOCK_AI=false and AI_PROVIDER=vertexai")

    client = genai.Client(
        vertexai=True,
        project=settings.gcp_project_id,
        location=settings.gcp_location,
    )
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=_build_prompt(content, meeting_date),
    )
    raw_text = response.text or ""
    return _parse_ai_json(raw_text)


def analyze_content(content: str, meeting_date: str | None) -> AiAnalyzeResponse:
    settings = get_settings()
    if settings.use_mock_ai:
        return AiAnalyzeResponse.model_validate(_mock_analyze(content, meeting_date))

    provider = settings.ai_provider.lower()
    if provider == "vertexai":
        return _call_vertex_ai(content, meeting_date)

    raise ValueError(f"Unsupported AI_PROVIDER: {settings.ai_provider}")


def analyze_meeting(db: Session, meeting_id: int, current_user: User) -> AiAnalyzeResponse:
    meeting = get_meeting_by_id(db, meeting_id, current_user)
    input_text = meeting.content or meeting.description or ""
    if not input_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting content is required before analysis",
        )

    meeting_date = meeting.meeting_date.isoformat() if meeting.meeting_date else None
    log = AiLog(
        meeting_id=meeting.id,
        input_text=input_text,
        status="PENDING",
        created_by=current_user.id,
    )
    db.add(log)
    db.flush()

    try:
        ai_result = analyze_content(input_text, meeting_date)
        meeting.summary = ai_result.summary
        log.ai_response = ai_result.model_dump_json()
        log.status = "SUCCESS"
        db.commit()
        db.refresh(meeting)
        return ai_result
    except Exception as exc:
        log.status = "FAILED"
        log.error_message = str(exc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI analysis failed: {exc}",
        ) from exc
