from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# --- Финансовый сценарий (FinancialScenario) ---

class FinancialScenarioBase(BaseModel):
    """Базовая схема финансового сценария"""
    name: str # Название сценария
    description: Optional[str] = None # Описание сценария
    revenue: float # Ожидаемая выручка
    expenses: float # Ожидаемые расходы
    profit: float # Ожидаемая прибыль

class FinancialScenarioCreate(FinancialScenarioBase):
    """Схема для создания финансового сценария"""
    pass

class FinancialScenarioResponse(FinancialScenarioBase):
    """Схема для ответа (включает ID и время создания)"""
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# --- Технико-экономические показатели (TEP) ---

class TEPBase(BaseModel):
    """Базовая схема ТЭП"""
    total_area: float # Общая площадь
    usable_area: float # Полезная площадь
    building_density: float # Плотность застройки
    parking_spaces: int # Количество парковочных мест
    scenario_id: int # Ссылка на финансовый сценарий

class TEPCreate(TEPBase):
    """Схема для создания ТЭП"""
    pass

class TEPResponse(TEPBase):
    """Схема для ответа с данными ТЭП"""
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# --- Квартирография (ApartmentMix) ---

class ApartmentMixBase(BaseModel):
    """Базовая схема квартирографии"""
    tep_id: int # Ссылка на ТЭП
    apartment_type: str # Тип квартиры (например, студия, 1-комнатная)
    count: int # Количество квартир
    average_area: float # Средняя площадь квартиры данного типа

class ApartmentMixCreate(ApartmentMixBase):
    """Схема для создания записи квартирографии"""
    pass

class ApartmentMixResponse(ApartmentMixBase):
    """Схема для ответа с данными квартирографии"""
    id: int
    
    model_config = ConfigDict(from_attributes=True)
