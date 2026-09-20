from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# --- Техническое задание на проектирование (DesignSpec) ---

class DesignSpecBase(BaseModel):
    """Базовая схема технического задания"""
    title: str # Название ТЗ
    content: str # Содержание ТЗ
    author_id: int # ID автора
    status: str # Статус ТЗ

class DesignSpecCreate(DesignSpecBase):
    """Схема для создания технического задания"""
    pass

class DesignSpecResponse(DesignSpecBase):
    """Схема ответа с данными технического задания"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# --- Объем рабочей документации (RDVolume) ---

class RDVolumeBase(BaseModel):
    """Базовая схема объема РД"""
    spec_id: int # Ссылка на ТЗ
    section_name: str # Название раздела (например, АР, КЖ)
    volume_pages: int # Объем в страницах
    completion_percentage: float # Процент завершения

class RDVolumeCreate(RDVolumeBase):
    """Схема для создания объема РД"""
    pass

class RDVolumeResponse(RDVolumeBase):
    """Схема ответа с данными объема РД"""
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# --- Комментарии к проверке (ReviewComment) ---

class ReviewCommentBase(BaseModel):
    """Базовая схема комментария к проверке"""
    volume_id: int # Ссылка на объем РД
    reviewer_id: int # ID проверяющего
    comment_text: str # Текст комментария
    is_resolved: bool = False # Статус разрешения комментария

class ReviewCommentCreate(ReviewCommentBase):
    """Схема для создания комментария"""
    pass

class ReviewCommentResponse(ReviewCommentBase):
    """Схема ответа с данными комментария"""
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
