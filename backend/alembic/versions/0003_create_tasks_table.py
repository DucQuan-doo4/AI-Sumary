"""create tasks table

Revision ID: 0003_create_tasks_table
Revises: 0002_create_meetings_tables
Create Date: 2026-06-18 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0003_create_tasks_table"
down_revision: Union[str, None] = "0002_create_meetings_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    task_priority = postgresql.ENUM("LOW", "MEDIUM", "HIGH", name="taskpriority", create_type=False)
    task_status = postgresql.ENUM("TODO", "IN_PROGRESS", "DONE", "CANCELLED", name="taskstatus", create_type=False)
    task_source = postgresql.ENUM("AI", "MANUAL", name="tasksource", create_type=False)
    task_priority.create(op.get_bind(), checkfirst=True)
    task_status.create(op.get_bind(), checkfirst=True)
    task_source.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("meeting_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("assignee_id", sa.Integer(), nullable=True),
        sa.Column("assignee_name", sa.String(length=255), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("priority", task_priority, nullable=False),
        sa.Column("status", task_status, nullable=False),
        sa.Column("source", task_source, nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["assignee_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tasks_id"), "tasks", ["id"], unique=False)
    op.create_index("ix_tasks_assignee_id", "tasks", ["assignee_id"], unique=False)
    op.create_index("ix_tasks_meeting_id", "tasks", ["meeting_id"], unique=False)
    op.create_index("ix_tasks_priority", "tasks", ["priority"], unique=False)
    op.create_index("ix_tasks_status", "tasks", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_tasks_status", table_name="tasks")
    op.drop_index("ix_tasks_priority", table_name="tasks")
    op.drop_index("ix_tasks_meeting_id", table_name="tasks")
    op.drop_index("ix_tasks_assignee_id", table_name="tasks")
    op.drop_index(op.f("ix_tasks_id"), table_name="tasks")
    op.drop_table("tasks")
    sa.Enum(name="tasksource").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="taskstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="taskpriority").drop(op.get_bind(), checkfirst=True)
