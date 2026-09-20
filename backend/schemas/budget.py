from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict

from models.budget import (
    BudgetCategory,
    ComplianceCheckType,
    ComplianceStatus,
    PaymentType,
)


class BudgetLineBase(BaseModel):
    """Базовая схема для строки бюджета."""
    project_id: int
    category: BudgetCategory
    name: str
    plan_amount: Decimal
    fact_amount: Decimal = Decimal("0.00")
    forecast_eac: Decimal
    notes: Optional[str] = None


class BudgetLineCreate(BudgetLineBase):
    """Схема для создания строки бюджета."""
    pass


class BudgetLineResponse(BudgetLineBase):
    """Схема для ответа (строка бюджета)."""
    id: int

    model_config = ConfigDict(from_attributes=True)


class BankLimitBase(BaseModel):
    """Базовая схема для банковского лимита."""
    project_id: int
    total_limit: Decimal
    used_amount: Decimal = Decimal("0.00")
    available: Decimal
    advance_limit_pct: Decimal = Decimal("30.00")
    is_frozen: bool = False


class BankLimitCreate(BankLimitBase):
    """Схема для создания банковского лимита."""
    pass


class BankLimitResponse(BankLimitBase):
    """Схема для ответа (банковский лимит)."""
    id: int

    model_config = ConfigDict(from_attributes=True)


class PaymentFactBase(BaseModel):
    """Базовая схема для фактического платежа."""
    budget_line_id: int
    ks2_act_id: Optional[int] = None
    amount: Decimal
    payment_date: date
    payment_type: PaymentType
    description: Optional[str] = None


class PaymentFactCreate(PaymentFactBase):
    """Схема для создания фактического платежа."""
    pass


class PaymentFactResponse(PaymentFactBase):
    """Схема для ответа (фактический платеж)."""
    id: int

    model_config = ConfigDict(from_attributes=True)


class ComplianceCheckBase(BaseModel):
    """Базовая схема для проверки комплаенса."""
    project_id: int
    check_type: ComplianceCheckType
    status: ComplianceStatus
    details: Optional[str] = None
    override_allowed: bool = False
    override_signatures: Optional[Dict[str, Any]] = None
    checked_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None


class ComplianceCheckCreate(ComplianceCheckBase):
    """Схема для создания проверки комплаенса."""
    pass


class ComplianceCheckResponse(ComplianceCheckBase):
    """Схема для ответа (проверка комплаенса)."""
    id: int

    model_config = ConfigDict(from_attributes=True)
