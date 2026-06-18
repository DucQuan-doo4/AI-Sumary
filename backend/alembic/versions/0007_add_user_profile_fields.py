"""add user profile fields

Revision ID: 0007_user_profile
Revises: 0006_meeting_classification
Create Date: 2026-06-18 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0007_user_profile"
down_revision: Union[str, None] = "0006_meeting_classification"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))
    op.add_column("users", sa.Column("department", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("room", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("personal_info", sa.String(length=2000), nullable=True))
    op.add_column("users", sa.Column("education", sa.String(length=2000), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "education")
    op.drop_column("users", "personal_info")
    op.drop_column("users", "room")
    op.drop_column("users", "department")
    op.drop_column("users", "avatar_url")
