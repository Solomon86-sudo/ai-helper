import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey, Enum, String, Numeric, Boolean, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database.db import Base


class ScenarioType(enum.Enum):
    base = "base"
    optimistic = "optimistic"
    pessimistic = "pessimistic"


class UnitType(enum.Enum):
    studio = "studio"
    k1 = "1k"
    k2 = "2k"
    k3 = "3k"
    k4 = "4k"


class FinancialScenario(Base):
    """Модель финансового сценария."""
    __tablename__ = "financial_scenarios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    scenario_type: Mapped[ScenarioType] = mapped_column(Enum(ScenarioType))
    revenue: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    capex_target: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    irr: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    npv: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class TEP(Base):
    """Модель технико-экономических показателей (ТЭП)."""
    __tablename__ = "teps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), unique=True, index=True)
    gba_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), doc="Общая площадь")
    gla_approved: Mapped[Decimal] = mapped_column(Numeric(10, 2), doc="Продаваемая площадь - жесткий лимит")
    floors_max: Mapped[int] = mapped_column(Integer)
    density: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    is_frozen: Mapped[bool] = mapped_column(Boolean, default=False)
    frozen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    frozen_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))


class ApartmentMix(Base):
    """Модель квартирографии (микс квартир)."""
    __tablename__ = "apartment_mixes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    unit_type: Mapped[UnitType] = mapped_column(Enum(UnitType))
    count: Mapped[int] = mapped_column(Integer)
    avg_area: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    min_area: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    max_area: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    pylon_step: Mapped[Decimal] = mapped_column(Numeric(10, 2))
