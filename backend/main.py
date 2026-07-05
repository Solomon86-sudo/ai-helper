from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import json
from typing import List, Optional
import os
import httpx
from openai import AsyncOpenAI
import logging

from database.vectordb import search_norms

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="ИИ-Помощник API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Настройка клиента OpenAI.
# По умолчанию настроено на локальный ИИ через Ollama (Llama 3 / Qwen)
# Для использования ChatGPT / YandexGPT / GigaChat, нужно поменять base_url и api_key
AI_BASE_URL = os.getenv("AI_BASE_URL", "http://localhost:11434/v1")
AI_API_KEY = os.getenv("AI_API_KEY", "ollama") # Любая строка для ollama
AI_MODEL = os.getenv("AI_MODEL", "llama3") 

try:
    http_client = httpx.AsyncClient(proxy=None, trust_env=False)
    client = AsyncOpenAI(
        base_url=AI_BASE_URL,
        api_key=AI_API_KEY,
        http_client=http_client
    )
except Exception as e:
    logging.error(f"Error initializing OpenAI client: {e}")
    client = None

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

@app.post("/api/chat")
async def chat_with_agent(req: ChatRequest):
    """
    Агент 'Спросить норму'. Использует RAG.
    """
    # 1. Поиск в Векторной базе
    rag_context = ""
    try:
        results = search_norms(req.message)
        if results and results['documents'] and len(results['documents'][0]) > 0:
            rag_context = "Найденные нормативы: " + " ".join(results['documents'][0])
        else:
            rag_context = "Нормативы в базе не найдены. Отвечай на базе общих знаний РФ."
    except Exception as e:
        logging.warning(f"ChromaDB not initialized properly or empty: {e}")
        rag_context = "Нет доступа к базе ПЗЗ. Отвечай на базе общих знаний РФ."

    system_prompt = f"""Ты — ИИ-эксперт в сфере градостроительства (ПЗЗ, ГрК РФ, СНиП) Санкт-Петербурга и Ленинградской области.
Отвечай профессионально, бюрократически точно.
Если есть нормативы из контекста, строго используй их:
{rag_context}
"""
    
    if client:
        try:
            response = await client.chat.completions.create(
                model=AI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": req.message}
                ],
                temperature=0.2
            )
            ai_text = response.choices[0].message.content
            return {"reply": ai_text, "source": "Векторная база + ИИ"}
        except Exception as e:
            logging.error(f"AI Error: {e}")
            return {"reply": f"Ошибка связи с ИИ: {str(e)}", "source": "Система"}
    else:
        return {"reply": "API клиент ИИ не инициализирован. Запустите Ollama или укажите ключ.", "source": "Система"}


@app.post("/api/audit")
async def audit_document(file: UploadFile = File(...)):
    """
    Агент 'Проверить документацию' (Заглушка OCR + ИИ)
    """
    # Здесь должен быть OCR (Tesseract / pdfplumber)
    # И передача текста в ИИ для анализа
    time.sleep(2) # Имитация работы
    
    return {
        "filename": file.filename,
        "results": [
            {
                "parameter": "Отступ от красной линии",
                "expected": "5 м (ПЗЗ)",
                "actual": "5 м",
                "status": "success",
                "comment": "Нарушений не выявлено"
            },
            {
                "parameter": "Высота здания",
                "expected": "Не более 15 м (АГО)",
                "actual": "16.5 м",
                "status": "error",
                "comment": "Превышение габаритов по согласованному АГО. Требуется корректировка."
            }
        ]
    }

@app.get("/api/roadmap")
async def get_roadmap(query: str):
    """
    Агент 'Дорожные карты' (Динамическая генерация через ИИ)
    """
    if not client:
        return {
            "title": "API ИИ не подключен",
            "authority": "Система",
            "steps": [
                {"title": "Установите ИИ", "desc": "Бэкенд не может подключиться к нейросети. Пожалуйста, запустите Ollama (например, `ollama run llama3`) или укажите ключ OpenAI в коде сервера.", "meta": "Требуется действие"}
            ]
        }
        
    system_prompt = """Ты эксперт по градостроительным согласованиям Санкт-Петербурга и Ленинградской области.
Пользователь запрашивает дорожную карту для процедуры.
Сгенерируй ответ СТРОГО в формате JSON без какого-либо текста до или после:
{
  "title": "Точное название процедуры",
  "authority": "Главное ведомство (например, Госстройнадзор или КГА)",
  "steps": [
    {"title": "Название шага 1", "desc": "Подробное описание действий", "meta": "Срок или результат"}
  ]
}"""

    try:
        response = await client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.2
        )
        ai_text = response.choices[0].message.content
        
        # Очистка текста от возможных маркдаун-тегов ```json ... ```
        if "```json" in ai_text:
            ai_text = ai_text.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_text:
            ai_text = ai_text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(ai_text)
        return data
    except Exception as e:
        logging.error(f"AI Error: {e}")
        return {
            "title": f"Сетевая ошибка при генерации дорожной карты",
            "authority": "Система",
            "steps": [
                {"title": "Ошибка", "desc": f"Не удалось распарсить ответ ИИ или нет связи с Ollama. Детали: {str(e)}", "meta": ""}
            ]
        }

@app.post("/api/manual")
async def generate_manual(
    stageP: Optional[UploadFile] = File(None),
    expertise: Optional[UploadFile] = File(None),
    passports: Optional[UploadFile] = File(None)
):
    """
    Агент 'Эксплуатация здания'
    """
    time.sleep(3) # Имитация парсинга и генерации
    return {
        "status": "success",
        "filename": "Инструкция_по_эксплуатации_объекта_V2.pdf",
        "details": "Сформировано разделов: 12. Включены графики ТО инженерных систем (Вентиляция, ИТП)."
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
