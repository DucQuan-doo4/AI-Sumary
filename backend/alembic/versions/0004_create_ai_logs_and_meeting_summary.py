"""create ai logs and meeting summary

Revision ID: 0004_ai_analyze
Revises: 0003_create_tasks_table
Create Date: 2026-06-18 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_ai_analyze"
down_revision: Union[str, None] = "0003_create_tasks_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("meetings", sa.Column("content", sa.Text(), nullable=True))
    op.add_column("meetings", sa.Column("summary", sa.Text(), nullable=True))

    op.create_table(
        "ai_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("meeting_id", sa.Integer(), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("ai_response", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_logs_id"), "ai_logs", ["id"], unique=False)
    op.create_index("ix_ai_logs_meeting_id", "ai_logs", ["meeting_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_ai_logs_meeting_id", table_name="ai_logs")
    op.drop_index(op.f("ix_ai_logs_id"), table_name="ai_logs")
    op.drop_table("ai_logs")
    op.drop_column("meetings", "summary")
    op.drop_column("meetings", "content")
