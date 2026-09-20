from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# Предполагается, что эти модули существуют в проекте
from backend.database import get_db
from backend import schemas
from backend import models

router = APIRouter(prefix="/api/erp/schedule", tags=["Schedule"])

@router.post("/wbs_items", response_model=schemas.WBSItemResponse)
def create_wbs_item(wbs_item: schemas.WBSItemCreate, db: Session = Depends(get_db)):
    """Создает новый элемент WBS (Иерархическая структура работ)."""
    db_wbs_item = models.WBSItem(**wbs_item.model_dump())
    db.add(db_wbs_item)
    db.commit()
    db.refresh(db_wbs_item)
    return db_wbs_item

@router.get("/wbs_items", response_model=List[schemas.WBSItemResponse])
def get_wbs_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получает список элементов WBS."""
    return db.query(models.WBSItem).offset(skip).limit(limit).all()

@router.put("/wbs_items/{id}/physical_percent", response_model=schemas.WBSItemResponse)
def update_physical_percent(id: int, percent_update: schemas.WBSItemPhysicalPercentUpdate, db: Session = Depends(get_db)):
    """Обновляет физический процент выполнения (отдельно от стоимостного)."""
    db_wbs_item = db.query(models.WBSItem).filter(models.WBSItem.id == id).first()
    if db_wbs_item is None:
        raise HTTPException(status_code=404, detail="Элемент WBS не найден")
    
    db_wbs_item.physical_percent = percent_update.physical_percent
    db.commit()
    db.refresh(db_wbs_item)
    return db_wbs_item

@router.post("/milestones", response_model=schemas.MilestoneResponse)
def create_milestone(milestone: schemas.MilestoneCreate, db: Session = Depends(get_db)):
    """Создает новую веху (Milestone)."""
    db_milestone = models.Milestone(**milestone.model_dump())
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)
    return db_milestone

@router.get("/milestones", response_model=List[schemas.MilestoneResponse])
def get_milestones(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получает список вех."""
    return db.query(models.Milestone).offset(skip).limit(limit).all()

@router.post("/plan_facts", response_model=schemas.PlanFactResponse)
def create_plan_fact(plan_fact: schemas.PlanFactCreate, db: Session = Depends(get_db)):
    """Создает факт выполнения плана."""
    db_plan_fact = models.PlanFact(**plan_fact.model_dump())
    db.add(db_plan_fact)
    db.commit()
    db.refresh(db_plan_fact)
    return db_plan_fact

@router.get("/plan_facts", response_model=List[schemas.PlanFactResponse])
def get_plan_facts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получает список фактов выполнения плана."""
    return db.query(models.PlanFact).offset(skip).limit(limit).all()
