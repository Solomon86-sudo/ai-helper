from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# Предполагается, что эти модули существуют в проекте
from backend.database import get_db
from backend import schemas
from backend import models

router = APIRouter(prefix="/api/erp/budget", tags=["Budget"])

@router.post("/budget_lines", response_model=schemas.BudgetLineResponse)
def create_budget_line(budget_line: schemas.BudgetLineCreate, db: Session = Depends(get_db)):
    """Создает новую строку бюджета."""
    db_budget_line = models.BudgetLine(**budget_line.model_dump())
    db.add(db_budget_line)
    db.commit()
    db.refresh(db_budget_line)
    return db_budget_line

@router.get("/budget_lines", response_model=List[schemas.BudgetLineResponse])
def get_budget_lines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получает список строк бюджета."""
    return db.query(models.BudgetLine).offset(skip).limit(limit).all()

@router.put("/budget_lines/{id}/recalculate_eac", response_model=schemas.BudgetLineResponse)
def recalculate_eac(id: int, eac_update: schemas.BudgetLineEACUpdate, db: Session = Depends(get_db)):
    """Обновляет прогноз EAC (Estimate at Completion) для строки бюджета."""
    db_budget_line = db.query(models.BudgetLine).filter(models.BudgetLine.id == id).first()
    if db_budget_line is None:
        raise HTTPException(status_code=404, detail="Строка бюджета не найдена")
    
    db_budget_line.forecast_eac = eac_update.forecast_eac
    db.commit()
    db.refresh(db_budget_line)
    return db_budget_line

@router.post("/bank_limits", response_model=schemas.BankLimitResponse)
def create_bank_limit(bank_limit: schemas.BankLimitCreate, db: Session = Depends(get_db)):
    """Создает новый банковский лимит."""
    db_bank_limit = models.BankLimit(**bank_limit.model_dump())
    db.add(db_bank_limit)
    db.commit()
    db.refresh(db_bank_limit)
    return db_bank_limit

@router.get("/bank_limits", response_model=List[schemas.BankLimitResponse])
def get_bank_limits(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получает список банковских лимитов."""
    return db.query(models.BankLimit).offset(skip).limit(limit).all()

@router.post("/payment_facts", response_model=schemas.PaymentFactResponse)
def create_payment_fact(payment_fact: schemas.PaymentFactCreate, db: Session = Depends(get_db)):
    """Создает факт платежа."""
    db_payment_fact = models.PaymentFact(**payment_fact.model_dump())
    db.add(db_payment_fact)
    db.commit()
    db.refresh(db_payment_fact)
    return db_payment_fact

@router.get("/payment_facts", response_model=List[schemas.PaymentFactResponse])
def get_payment_facts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получает список фактов платежей."""
    return db.query(models.PaymentFact).offset(skip).limit(limit).all()
