"""
Модуль для работы с базой данных.
"""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config import settings

# Проверяем, используется ли SQLite, чтобы добавить нужные аргументы
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator:
    """
    Получение сессии базы данных (зависимость для FastAPI).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    """
    Создание всех таблиц в базе данных.
    """
    # Импортируем все модели перед созданием таблиц
    import models  # noqa: F401 — импорт регистрирует модели в Base
    Base.metadata.create_all(bind=engine)
