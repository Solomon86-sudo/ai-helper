"""
Модели проектов и пользователей.
"""
import enum
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.db import Base
from models.base import TimestampMixin

class UserRole(str, enum.Enum):
    """
    Роли пользователей.
    """
    GIP = "GIP"
    PTO = "PTO"
    RP = "RP"
    TENDER = "TENDER"
    ADMIN = "ADMIN"

class ProjectStatus(str, enum.Enum):
    """
    Статусы проекта.
    """
    DRAFT = "draft"
    ACTIVE = "active"
    FROZEN = "frozen"
    COMPLETED = "completed"

class User(Base, TimestampMixin):
    """
    Модель пользователя.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    role: Mapped[UserRole] = mapped_column(String(50), default=UserRole.GIP)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Project(Base, TimestampMixin):
    """
    Модель проекта.
    """
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    address: Mapped[str] = mapped_column(String(500))
    status: Mapped[ProjectStatus] = mapped_column(String(50), default=ProjectStatus.DRAFT)
    
    settings: Mapped["ProjectSettings"] = relationship(back_populates="project", uselist=False)

class ProjectSettings(Base):
    """
    Настройки проекта.
    """
    __tablename__ = "project_settings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), unique=True)
    constraints_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    notification_settings: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="settings")
