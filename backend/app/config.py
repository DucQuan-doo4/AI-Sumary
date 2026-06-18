from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Meeting Action Tracking System"
    environment: str = "development"
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    backend_cors_origins: str = "http://localhost:5173"
    default_admin_email: str = "admin@example.com"
    default_admin_password: str = "admin123"
    default_admin_full_name: str = "System Admin"
    ai_provider: str = "vertexai"
    use_mock_ai: bool = True
    gcp_project_id: str | None = None
    gcp_location: str = "us-central1"
    gemini_model: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
