from datetime import datetime, date
from decimal import Decimal
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from models.construction import (
    MobilizationStatus,
    PrescriptionType,
    SeverityLevel,
    PrescriptionStatus,
    KS2Status
)


# Mobilization schemas
class MobilizationBase(BaseModel):
    contract_id: int
    front_transfer_act: Optional[str] = None
    ppr_document: Optional[str] = None
    orders_document: Optional[str] = None
    notes: Optional[str] = None


class MobilizationCreate(MobilizationBase):
    status: MobilizationStatus = MobilizationStatus.PENDING


class MobilizationResponse(MobilizationBase):
    id: int
    status: MobilizationStatus
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Prescription schemas
class PrescriptionBase(BaseModel):
    project_id: int
    contract_id: Optional[int] = None
    description: str
    prescription_type: PrescriptionType
    severity: SeverityLevel
    penalty_amount: Decimal = Decimal("0.00")
    photo_path: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    inspector_id: int
    status: PrescriptionStatus = PrescriptionStatus.OPEN


class PrescriptionResponse(PrescriptionBase):
    id: int
    inspector_id: int
    status: PrescriptionStatus
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# KS2Act schemas
class KS2ActBase(BaseModel):
    contract_id: int
    act_number: str
    period_start: date
    period_end: date
    amount: Decimal
    volume_data: dict[str, Any]
    has_penalty_deduction: bool = False
    penalty_deducted: Decimal = Decimal("0.00")
    payment_amount: Decimal


class KS2ActCreate(KS2ActBase):
    status: KS2Status = KS2Status.DRAFT


class KS2ActResponse(KS2ActBase):
    id: int
    status: KS2Status
    submitted_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# KS6Journal schemas
class KS6JournalBase(BaseModel):
    contract_id: int
    entry_date: date
    work_description: str
    volume_completed: Decimal = Field(..., max_digits=15, decimal_places=3)
    unit: str
    physical_percent: Decimal = Field(..., max_digits=5, decimal_places=2)
    notes: Optional[str] = None


class KS6JournalCreate(KS6JournalBase):
    pass


class KS6JournalResponse(KS6JournalBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
