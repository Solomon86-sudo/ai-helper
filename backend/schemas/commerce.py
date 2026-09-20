from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from models.commerce import TenderStatus, ContractStatus, ChangeRequestStatus


# Tender schemas
class TenderBase(BaseModel):
    project_id: int
    title: str = Field(..., max_length=255)
    description: str
    discipline: str = Field(..., max_length=100)
    deadline: Optional[date] = None
    is_emergency: bool = False


class TenderCreate(TenderBase):
    created_by: int
    status: TenderStatus = TenderStatus.draft


class TenderResponse(TenderBase):
    id: int
    created_by: int
    status: TenderStatus

    model_config = ConfigDict(from_attributes=True)


# TenderBid schemas
class TenderBidBase(BaseModel):
    tender_id: int
    contractor_name: str = Field(..., max_length=255)
    contractor_inn: str = Field(..., max_length=12)
    amount: Decimal
    has_accepted_contract_terms: bool = False


class TenderBidCreate(TenderBidBase):
    pass


class TenderBidResponse(TenderBidBase):
    id: int
    submitted_at: datetime
    is_winner: bool

    model_config = ConfigDict(from_attributes=True)


# Contract schemas
class ContractBase(BaseModel):
    tender_id: Optional[int] = None
    project_id: int
    contractor_name: str = Field(..., max_length=255)
    contractor_inn: str = Field(..., max_length=12)
    total_amount: Decimal
    is_emergency: bool = False


class ContractCreate(ContractBase):
    status: ContractStatus = ContractStatus.draft


class ContractResponse(ContractBase):
    id: int
    frozen_amount: Optional[Decimal] = None
    status: ContractStatus
    signed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# BaseEstimate schemas
class BaseEstimateBase(BaseModel):
    contract_id: int
    total_amount: Decimal
    volume_breakdown: Optional[Any] = None


class BaseEstimateCreate(BaseEstimateBase):
    pass


class BaseEstimateResponse(BaseEstimateBase):
    id: int
    frozen_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ChangeRequest schemas
class ChangeRequestBase(BaseModel):
    contract_id: int
    reason: str
    delta_amount: Decimal
    new_total: Decimal


class ChangeRequestCreate(ChangeRequestBase):
    signatures: Optional[Any] = None
    required_signatures: int = 3
    status: ChangeRequestStatus = ChangeRequestStatus.pending


class ChangeRequestResponse(ChangeRequestBase):
    id: int
    status: ChangeRequestStatus
    signatures: Optional[Any] = None
    required_signatures: int
    created_at: datetime
    approved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
