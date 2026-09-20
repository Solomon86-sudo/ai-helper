"""
Конфигурация приложения.
"""
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Настройки приложения.
    """
    DATABASE_URL: str = "sqlite:///./backend/database/erp.db"
    AI_BASE_URL: str = "http://localhost:8000"
    AI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4o"
    CONSTRAINTS_ENABLED: bool = False
    SECRET_KEY: str = "dev-secret-key-change-in-production"

    class Config:
        env_file = ".env"

settings = Settings()
