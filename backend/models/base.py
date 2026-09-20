"""
Базовые миксины и перечисления для моделей.
"""
from datetime import datetime
from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

class TimestampMixin:
    """
    Миксин для автоматического добавления времени создания и обновления.
    """
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class StatusMixin:
    """
    Миксин для добавления статуса по умолчанию.
    """
    status: Mapped[str] = mapped_column(String(50), default="draft")

class AuditMixin:
    """
    Миксин для отслеживания авторов создания и изменения записей.
    """
    created_by: Mapped[int | None] = mapped_column()
    updated_by: Mapped[int | None] = mapped_column()
