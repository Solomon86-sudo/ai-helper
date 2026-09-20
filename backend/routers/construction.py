from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

# Предполагается, что эти модули существуют и импортируются должным образом
from ..database import get_db
from ..models import Mobilization, Prescription, KS2Act, BaseEstimate
from ..schemas import MobilizationSchema, PrescriptionSchema, KS2ActSchema, MobilizationCreate, PrescriptionCreate, KS2ActCreate
from ..config import settings # Предполагается наличие настроек проекта (CONSTRAINTS_ENABLED)

router = APIRouter(prefix="/api/erp/construction", tags=["Construction"])

@router.post("/mobilizations/", response_model=MobilizationSchema)
def create_mobilization(mob: MobilizationCreate, db: Session = Depends(get_db)):
    """
    Создает запись о мобилизации.
    """
    # Логика создания (заглушка)
    pass

@router.post("/prescriptions/", response_model=PrescriptionSchema)
def create_prescription(presc: PrescriptionCreate, db: Session = Depends(get_db)):
    """
    Создает предписание.
    """
    # Логика создания (заглушка)
    pass

@router.post("/ks2/", response_model=KS2ActSchema)
def create_ks2(ks2: KS2ActCreate, db: Session = Depends(get_db)):
    """
    Создает акт КС-2 (без проверки).
    """
    # Логика создания (заглушка)
    pass

@router.post("/ks2/validate", response_model=KS2ActSchema)
def validate_ks2(ks2: KS2ActCreate, db: Session = Depends(get_db)):
    """
    Специальный эндпоинт, который проверяет, превышает ли сумма подаваемого акта КС-2
    плюс сумма предыдущих КС-2 для данного контракта итоговую сумму базовой сметы (total_amount).
    Если превышает, блокирует создание, если CONSTRAINTS_ENABLED != False.
    """
    # Получаем базовую смету для контракта (предполагается, что у KS2Act есть contract_id)
    base_estimate = db.query(BaseEstimate).filter(BaseEstimate.contract_id == ks2.contract_id).first()
    if not base_estimate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Базовая смета для контракта не найдена")

    # Считаем сумму предыдущих актов КС-2 по данному контракту
    previous_ks2_sum = db.query(func.sum(KS2Act.amount)).filter(KS2Act.contract_id == ks2.contract_id).scalar() or 0
    
    total_requested_amount = previous_ks2_sum + ks2.amount
    
    # Проверяем превышение
    if total_requested_amount > base_estimate.total_amount:
        # Блокируем, если проверки включены (по умолчанию True)
        if getattr(settings, "CONSTRAINTS_ENABLED", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Сумма актов превышает базовую смету. Запрошено (вкл. предыдущие): {total_requested_amount}, Доступно в смете: {base_estimate.total_amount}"
            )
            
    # Если все проверки пройдены, создаем акт КС-2
    new_ks2 = KS2Act(**ks2.dict())
    db.add(new_ks2)
    db.commit()
    db.refresh(new_ks2)
    
    return new_ks2
