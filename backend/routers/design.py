"""
Роутер модуля Проектирование.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from decimal import Decimal

from database.db import get_db
from models.design import DesignSpec, RDVolume, ReviewComment
from models.predev import TEP
from schemas.design import (
    DesignSpecCreate, DesignSpecResponse,
    RDVolumeCreate, RDVolumeResponse,
    ReviewCommentCreate, ReviewCommentResponse
)
from config import settings
from services.gdrive import upload_file_to_gdrive

router = APIRouter(prefix="/api/erp/design", tags=["Design"])

@router.post("/specs", response_model=DesignSpecResponse)
def create_spec(spec_in: DesignSpecCreate, db: Session = Depends(get_db)):
    """Создать ТЗ."""
    db_obj = DesignSpec(**spec_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/volumes", response_model=RDVolumeResponse)
def create_volume(volume_in: RDVolumeCreate, db: Session = Depends(get_db)):
    """Добавить том РД."""
    db_obj = RDVolume(**volume_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/check_gla")
def check_gla(project_id: int, current_gla: Decimal, db: Session = Depends(get_db)):
    """
    Проверка GLA проекта.
    Сравнивает текущую проектируемую продаваемую площадь с утвержденным ТЭП.
    """
    tep = db.query(TEP).filter(TEP.project_id == project_id).first()
    if not tep:
        raise HTTPException(status_code=404, detail="ТЭП не найден для данного проекта")
    
    if settings.CONSTRAINTS_ENABLED and current_gla > tep.gla_approved:
        raise HTTPException(
            status_code=400,
            detail=f"БЛОКИРОВКА: Проектируемая GLA ({current_gla}) превышает лимит ТЭП ({tep.gla_approved})"
        )
    
    return {
        "status": "ok",
        "current_gla": current_gla,
        "limit_gla": tep.gla_approved,
        "delta": tep.gla_approved - current_gla
    }

@router.post("/upload_rd")
async def upload_rd_document(file: UploadFile = File(...)):
    """
    Загрузка чертежа (PDF и др.) напрямую в Google Drive.
    Возвращает публичную ссылку на загруженный файл и извлеченный текст для ИИ.
    """
    # Читаем файл в память
    file_bytes = await file.read()
    
    from io import BytesIO
    file_obj = BytesIO(file_bytes)
    
    extracted_text = ""
    # Извлечение текста (OCR) если это PDF
    if file.filename.lower().endswith(".pdf"):
        try:
            import fitz  # PyMuPDF
            file_obj.seek(0)
            doc = fitz.open(stream=file_obj.read(), filetype="pdf")
            for page in doc[:3]: # Читаем первые 3 страницы (обычно штампы там)
                extracted_text += page.get_text("text") + "\n"
        except Exception as e:
            print("Ошибка PyMuPDF:", e)

    file_obj.seek(0)
    # Отправляем в Google Drive
    link = upload_file_to_gdrive(file_obj, file.filename, file.content_type)
    
    if not link:
        raise HTTPException(status_code=500, detail="Ошибка при загрузке файла в Google Drive (проверьте credentials.json)")
        
    return {
        "status": "success",
        "filename": file.filename,
        "drive_link": link,
        "extracted_text": extracted_text[:2000] # Ограничиваем длину для ИИ
    }

