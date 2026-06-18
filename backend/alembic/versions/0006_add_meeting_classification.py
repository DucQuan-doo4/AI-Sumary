"""add meeting classification fields

Revision ID: 0006_meeting_classification
Revises: 0005_notifications
Create Date: 2026-06-18 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0006_meeting_classification"
down_revision: Union[str, None] = "0005_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("meetings", sa.Column("category", sa.String(length=100), nullable=True))
    op.add_column("meetings", sa.Column("tags", sa.Text(), nullable=True))
    op.create_index("ix_meetings_category", "meetings", ["category"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_meetings_category", table_name="meetings")
    op.drop_column("meetings", "tags")
    op.drop_column("meetings", "category")
