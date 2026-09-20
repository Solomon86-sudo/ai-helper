import enum
from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey, String, Text, Enum, Boolean, Numeric, Date, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.db import Base


class MilestoneStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"


class WBSItem(Base):
    """Модель элемента иерархической структуры работ (WBS)."""
    __tablename__ = "wbs_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("wbs_items.id"), nullable=True, index=True)
    
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    title: Mapped[str] = mapped_column(String)
    level: Mapped[int] = mapped_column(Integer)
    weight: Mapped[Decimal] = mapped_column(Numeric(5, 4), comment="Вес для матрицы Physical%")
    discipline: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    children = relationship("WBSItem", backref="parent", remote_side=[id])


class Milestone(Base):
    """Модель ключевой вехи проекта (Milestone)."""
    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    wbs_item_id: Mapped[Optional[int]] = mapped_column(ForeignKey("wbs_items.id"), nullable=True, index=True)
    
    title: Mapped[str] = mapped_column(String)
    planned_date: Mapped[date] = mapped_column(Date)
    actual_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    status: Mapped[MilestoneStatus] = mapped_column(Enum(MilestoneStatus), default=MilestoneStatus.PENDING)
    is_critical_path: Mapped[bool] = mapped_column(Boolean, default=False)


class PlanFact(Base):
    """
    Модель план-факта выполнения работ.
    ВАЖНО: Physical% рассчитывается от физических объемов на площадке (WBS weight matrix). 
    Cost% рассчитывается от денег (KS payments). Они разделены и не смешиваются.
    """
    __tablename__ = "plan_facts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    wbs_item_id: Mapped[int] = mapped_column(ForeignKey("wbs_items.id"), index=True)
    period: Mapped[date] = mapped_column(Date, comment="Отчетный месяц")
    
    planned_physical_pct: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    actual_physical_pct: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=0)
    
    planned_cost_pct: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    actual_cost_pct: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=0)
    
    planned_cost_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    actual_cost_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
