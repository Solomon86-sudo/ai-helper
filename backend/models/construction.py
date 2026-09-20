import enum
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, Any

from sqlalchemy import ForeignKey, String, Text, Enum, Boolean, Numeric, Date, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.db import Base


class MobilizationStatus(enum.Enum):
    PENDING = "pending"
    DOCUMENTS_UPLOADED = "documents_uploaded"
    APPROVED = "approved"
    REJECTED = "rejected"

class PrescriptionType(enum.Enum):
    DEFECT = "defect"
    SAFETY = "safety"
    QUALITY = "quality"
    DEADLINE = "deadline"

class SeverityLevel(enum.Enum):
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"

class PrescriptionStatus(enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class KS2Status(enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    VERIFIED = "verified"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"


class Mobilization(Base):
    """Модель для управления мобилизацией (допуск к работам)."""
    __tablename__ = "mobilizations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    status: Mapped[MobilizationStatus] = mapped_column(Enum(MobilizationStatus), default=MobilizationStatus.PENDING)
    
    front_transfer_act: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ppr_document: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    orders_document: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Prescription(Base):
    """Модель предписаний технадзора."""
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    contract_id: Mapped[Optional[int]] = mapped_column(ForeignKey("contracts.id"), nullable=True, index=True)
    inspector_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    description: Mapped[str] = mapped_column(Text)
    prescription_type: Mapped[PrescriptionType] = mapped_column(Enum(PrescriptionType))
    severity: Mapped[SeverityLevel] = mapped_column(Enum(SeverityLevel))
    status: Mapped[PrescriptionStatus] = mapped_column(Enum(PrescriptionStatus), default=PrescriptionStatus.OPEN)
    
    penalty_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    photo_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    resolved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)


class KS2Act(Base):
    """Модель актов выполненных работ КС-2."""
    __tablename__ = "ks2_acts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    act_number: Mapped[str] = mapped_column(String, index=True)
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    volume_data: Mapped[dict[str, Any]] = mapped_column(JSON)
    
    status: Mapped[KS2Status] = mapped_column(Enum(KS2Status), default=KS2Status.DRAFT)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    verified_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    has_penalty_deduction: Mapped[bool] = mapped_column(Boolean, default=False)
    penalty_deducted: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    payment_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    
    approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class KS6Journal(Base):
    """Модель журнала учета выполненных работ КС-6а."""
    __tablename__ = "ks6_journals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    entry_date: Mapped[date] = mapped_column(Date)
    
    work_description: Mapped[str] = mapped_column(Text)
    volume_completed: Mapped[Decimal] = mapped_column(Numeric(15, 3))
    unit: Mapped[str] = mapped_column(String)
    physical_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
