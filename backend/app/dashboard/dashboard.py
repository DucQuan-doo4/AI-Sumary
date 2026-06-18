from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.dashboard import dashboard_service
from app.dashboard.schemas import (
    DashboardOverview,
    DashboardTaskItem,
    TasksByStatusItem,
    TasksByUserItem,
)
from app.database import get_db
from app.users.models import User


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_overview(db, current_user)


@router.get("/tasks-by-status", response_model=list[TasksByStatusItem])
def dashboard_tasks_by_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_tasks_by_status(db, current_user)


@router.get("/tasks-by-user", response_model=list[TasksByUserItem])
def dashboard_tasks_by_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_tasks_by_user(db, current_user)


@router.get("/overdue-tasks", response_model=list[DashboardTaskItem])
def dashboard_overdue_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_overdue_tasks(db, current_user)


@router.get("/upcoming-deadlines", response_model=list[DashboardTaskItem])
def dashboard_upcoming_deadlines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_upcoming_deadlines(db, current_user)
