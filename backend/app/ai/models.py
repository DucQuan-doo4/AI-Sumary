from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AiLog(Base):
    __tablename__ = "ai_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    input_text: Mapped[str] = mapped_column(Text, nullable=False)
    ai_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
