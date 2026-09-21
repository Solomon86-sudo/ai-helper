from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Предполагается, что эти модули существуют и импортируются должным образом
from database.db import get_db
from models import Tender, Contract, BaseEstimate, ChangeRequest
from schemas import TenderSchema, ContractSchema, BaseEstimateSchema, ChangeRequestSchema, TenderCreate, ContractCreate, BaseEstimateCreate, ChangeRequestCreate

router = APIRouter(prefix="/api/erp/commerce", tags=["Commerce"])

@router.post("/tenders/", response_model=TenderSchema)
def create_tender(tender: TenderCreate, db: Session = Depends(get_db)):
    """
    Создает новый тендер.
    """
    # Логика создания тендера (заглушка)
    pass

@router.post("/contracts/", response_model=ContractSchema)
def create_contract(contract: ContractCreate, db: Session = Depends(get_db)):
    """
    Создает новый контракт.
    """
    # Логика создания контракта (заглушка)
    pass

@router.post("/base-estimates/", response_model=BaseEstimateSchema)
def create_base_estimate(estimate: BaseEstimateCreate, db: Session = Depends(get_db)):
    """
    Создает базовую смету.
    """
    # Логика создания базовой сметы (заглушка)
    pass

@router.post("/change-requests/", response_model=ChangeRequestSchema)
def create_change_request(request: ChangeRequestCreate, db: Session = Depends(get_db)):
    """
    Создает запрос на изменение.
    """
    # Логика создания запроса на изменение (заглушка)
    pass

@router.post("/contracts/{contract_id}/freeze", response_model=ContractSchema)
def freeze_contract(contract_id: int, db: Session = Depends(get_db)):
    """
    Специальный эндпоинт, который создает базовую смету (BaseEstimate),
    равную сумме контракта (amount), и устанавливает сумму в замороженную (frozen_amount).
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Контракт не найден")
    
    # Создаем базовую смету, равную сумме контракта
    base_estimate = BaseEstimate(
        contract_id=contract.id,
        total_amount=contract.amount
    )
    db.add(base_estimate)
    
    # Замораживаем сумму контракта
    contract.frozen_amount = contract.amount
    
    db.commit()
    db.refresh(contract)
    
    return contract
