import enum
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Any

from sqlalchemy import ForeignKey, Enum, String, Integer, Text, DateTime, Boolean, Date, Numeric, JSON
from sqlalchemy.orm import Mapped, mapped_column

from database.db import Base


class TenderStatus(enum.Enum):
    draft = "draft"
    open = "open"
    evaluation = "evaluation"
    awarded = "awarded"
    cancelled = "cancelled"


class ContractStatus(enum.Enum):
    draft = "draft"
    negotiation = "negotiation"
    signed = "signed"
    active = "active"
    completed = "completed"
    terminated = "terminated"


class ChangeRequestStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Tender(Base):
    """Модель тендера."""
    __tablename__ = "tenders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[TenderStatus] = mapped_column(Enum(TenderStatus), default=TenderStatus.draft)
    discipline: Mapped[str] = mapped_column(String(100))
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    deadline: Mapped[Optional[date]] = mapped_column(Date)
    is_emergency: Mapped[bool] = mapped_column(Boolean, default=False, doc="Для срочных закупок (Emergency Procurement)")


class TenderBid(Base):
    """Модель заявки на тендер."""
    __tablename__ = "tender_bids"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tender_id: Mapped[int] = mapped_column(ForeignKey("tenders.id"), index=True)
    contractor_name: Mapped[str] = mapped_column(String(255))
    contractor_inn: Mapped[str] = mapped_column(String(12))
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    has_accepted_contract_terms: Mapped[bool] = mapped_column(Boolean, default=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_winner: Mapped[bool] = mapped_column(Boolean, default=False)


class Contract(Base):
    """Модель договора."""
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tender_id: Mapped[Optional[int]] = mapped_column(ForeignKey("tenders.id"), index=True, doc="Может быть пустым для срочных")
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    contractor_name: Mapped[str] = mapped_column(String(255))
    contractor_inn: Mapped[str] = mapped_column(String(12))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    frozen_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), doc="Фиксируется при статусе signed")
    status: Mapped[ContractStatus] = mapped_column(Enum(ContractStatus), default=ContractStatus.draft)
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_emergency: Mapped[bool] = mapped_column(Boolean, default=False)


class BaseEstimate(Base):
    """Модель базовой сметы к договору."""
    __tablename__ = "base_estimates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), unique=True, index=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    volume_breakdown: Mapped[Optional[Any]] = mapped_column(JSON)
    frozen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class ChangeRequest(Base):
    """Модель запроса на изменение (доп. соглашение)."""
    __tablename__ = "change_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    reason: Mapped[str] = mapped_column(Text)
    delta_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    new_total: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    status: Mapped[ChangeRequestStatus] = mapped_column(Enum(ChangeRequestStatus), default=ChangeRequestStatus.pending)
    signatures: Mapped[Optional[Any]] = mapped_column(JSON, doc="Массив user_ids кто подписал")
    required_signatures: Mapped[int] = mapped_column(Integer, default=3)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
