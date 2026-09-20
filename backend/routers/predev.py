"""
Роутер модуля Предпроект.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.db import get_db
from models.predev import TEP, FinancialScenario, ApartmentMix
from schemas.predev import (
    TEPCreate, TEPResponse,
    FinancialScenarioCreate, FinancialScenarioResponse,
    ApartmentMixCreate, ApartmentMixResponse
)

router = APIRouter(prefix="/api/erp/predev", tags=["Pre-Development"])

@router.post("/tep", response_model=TEPResponse)
def create_tep(tep_in: TEPCreate, db: Session = Depends(get_db)):
    """Создать ТЭП проекта."""
    db_obj = TEP(**tep_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/tep/{project_id}", response_model=TEPResponse)
def get_tep(project_id: int, db: Session = Depends(get_db)):
    """Получить ТЭП по ID проекта."""
    db_obj = db.query(TEP).filter(TEP.project_id == project_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="ТЭП не найден")
    return db_obj

@router.post("/scenarios", response_model=FinancialScenarioResponse)
def create_scenario(scenario_in: FinancialScenarioCreate, db: Session = Depends(get_db)):
    """Создать финансовый сценарий."""
    db_obj = FinancialScenario(**scenario_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/apartments", response_model=ApartmentMixResponse)
def create_apartment_mix(mix_in: ApartmentMixCreate, db: Session = Depends(get_db)):
    """Создать квартирографию."""
    db_obj = ApartmentMix(**mix_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
