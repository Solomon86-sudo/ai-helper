from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from models.schedule import MilestoneStatus


class WBSItemBase(BaseModel):
    """Базовая схема для элемента WBS."""
    project_id: int
    parent_id: Optional[int] = None
    code: str
    title: str
    level: int
    weight: Decimal
    discipline: Optional[str] = None


class WBSItemCreate(WBSItemBase):
    """Схема для создания элемента WBS."""
    pass


class WBSItemResponse(WBSItemBase):
    """Схема для ответа (элемент WBS)."""
    id: int

    model_config = ConfigDict(from_attributes=True)


class MilestoneBase(BaseModel):
    """Базовая схема для вехи проекта."""
    project_id: int
    wbs_item_id: Optional[int] = None
    title: str
    planned_date: date
    actual_date: Optional[date] = None
    status: MilestoneStatus = MilestoneStatus.PENDING
    is_critical_path: bool = False


class MilestoneCreate(MilestoneBase):
    """Схема для создания вехи проекта."""
    pass


class MilestoneResponse(MilestoneBase):
    """Схема для ответа (веха проекта)."""
    id: int

    model_config = ConfigDict(from_attributes=True)


class PlanFactBase(BaseModel):
    """Базовая схема для план-факта."""
    wbs_item_id: int
    period: date
    planned_physical_pct: Decimal
    actual_physical_pct: Decimal = Decimal("0.00")
    planned_cost_pct: Decimal
    actual_cost_pct: Decimal = Decimal("0.00")
    planned_cost_amount: Decimal
    actual_cost_amount: Decimal = Decimal("0.00")
    notes: Optional[str] = None


class PlanFactCreate(PlanFactBase):
    """Схема для создания план-факта."""
    pass


class PlanFactResponse(PlanFactBase):
    """Схема для ответа (план-факт)."""
    id: int

    model_config = ConfigDict(from_attributes=True)
