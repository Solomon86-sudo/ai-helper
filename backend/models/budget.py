import enum
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, Any

from sqlalchemy import ForeignKey, String, Text, Enum, Boolean, Numeric, Date, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.db import Base


class BudgetCategory(enum.Enum):
    LAND = "land"
    DESIGN = "design"
    CONSTRUCTION = "construction"
    EQUIPMENT = "equipment"
    OVERHEAD = "overhead"
    MARKETING = "marketing"
    FINANCE = "finance"
    RESERVE = "reserve"

class PaymentType(enum.Enum):
    ADVANCE = "advance"
    PROGRESS = "progress"
    RETENTION_RELEASE = "retention_release"
    PENALTY_REFUND = "penalty_refund"

class ComplianceCheckType(enum.Enum):
    ADVANCE_LIMIT = "advance_limit"
    BUDGET_OVERRUN = "budget_overrun"
    COVENANT_BREACH = "covenant_breach"

class ComplianceStatus(enum.Enum):
    PASSED = "passed"
    WARNING = "warning"
    BLOCKED = "blocked"


class BudgetLine(Base):
    """Модель строки бюджета проекта."""
    __tablename__ = "budget_lines"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    
    category: Mapped[BudgetCategory] = mapped_column(Enum(BudgetCategory))
    name: Mapped[str] = mapped_column(String)
    
    plan_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), comment="Лимит банка, несгораемый")
    fact_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment="Автоматически из оплаченных КС")
    forecast_eac: Mapped[Decimal] = mapped_column(Numeric(15, 2), comment="Факт + Остаток + Переделки")
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class BankLimit(Base):
    """Модель банковских лимитов проекта."""
    __tablename__ = "bank_limits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), unique=True, index=True)
    
    total_limit: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    used_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    
    available: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    
    advance_limit_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=30, comment="Максимальный % аванса")
    is_frozen: Mapped[bool] = mapped_column(Boolean, default=False)


class PaymentFact(Base):
    """Модель фактических платежей."""
    __tablename__ = "payment_facts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    budget_line_id: Mapped[int] = mapped_column(ForeignKey("budget_lines.id"), index=True)
    ks2_act_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ks2_acts.id"), nullable=True, index=True)
    
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    payment_date: Mapped[date] = mapped_column(Date)
    payment_type: Mapped[PaymentType] = mapped_column(Enum(PaymentType))
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ComplianceCheck(Base):
    """Модель проверок комплаенса и банковских ковенантов."""
    __tablename__ = "compliance_checks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    
    check_type: Mapped[ComplianceCheckType] = mapped_column(Enum(ComplianceCheckType))
    status: Mapped[ComplianceStatus] = mapped_column(Enum(ComplianceStatus))
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    override_allowed: Mapped[bool] = mapped_column(Boolean, default=False)
    override_signatures: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    checked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
