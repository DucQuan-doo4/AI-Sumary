from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.ai.ai import router as ai_router
from app.auth.router import router as auth_router
from app.config import get_settings
from app.dashboard.dashboard import router as dashboard_router
from app.meetings.meetings import router as meetings_router
from app.notifications.notifications import router as notifications_router
from app.tasks.tasks import router as tasks_router
from app.users.users import router as users_router


settings = get_settings()
Path("uploads").mkdir(parents=True, exist_ok=True)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(meetings_router)
app.include_router(tasks_router)
app.include_router(ai_router)
app.include_router(dashboard_router)
app.include_router(notifications_router)
app.include_router(users_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health")
def health_check():
    return {"status": "ok"}
