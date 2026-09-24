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
from search_web import get_web_context
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="ИИ-Помощник API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Настройка клиента OpenAI-совместимого API.
# По умолчанию настроено на Groq (бесплатный облачный ИИ).
# Для использования локальной Ollama: AI_BASE_URL=http://localhost:11434/v1, AI_API_KEY=ollama
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1")
AI_API_KEY = os.getenv("AI_API_KEY", "groq") # Нужен реальный ключ от Groq
AI_MODEL = os.getenv("AI_MODEL", "qwen/qwen3.8-27b") 

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

# --- Добавление ERP Роутеров ---
from routers import predev, design
# Остальные роутеры пока отключены (незакончены схемы):
# from routers import commerce, construction, budget, schedule

app.include_router(predev.router)
app.include_router(design.router)
# app.include_router(commerce.router)
# app.include_router(construction.router)
# app.include_router(budget.router)
# app.include_router(schedule.router)
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

@app.post("/api/chat")
async def chat_with_agent(req: ChatRequest):
    """
    Агент 'Спросить норму'. Использует RAG и Web-поиск.
    """
    # 1. Поиск в Векторной базе
    rag_context = ""
    web_context = ""
    is_audit = len(req.message) > 500 or "AI-аудитор" in req.message
    
    if not is_audit:
        try:
            results = search_norms(req.message)
            if results and results['documents'] and len(results['documents'][0]) > 0:
                rag_context = "Найденные нормативы из локальной базы:\n" + "\n---\n".join(results['documents'][0])
            else:
                rag_context = "В локальной базе нормативов ничего не найдено."
        except Exception as e:
            logging.warning(f"ChromaDB error: {e}")
            rag_context = "Локальная база нормативов недоступна."

        # 2. Поиск в Интернете по доверенным сайтам
        try:
            web_text = await get_web_context(req.message)
            if web_text:
                web_context = "Найденные актуальные нормативы в ИНТЕРНЕТЕ (строго отдавай им приоритет, если они новее локальной базы):\n" + web_text
            else:
                web_context = "В интернете на доверенных сайтах точного ответа не найдено."
        except Exception as e:
            logging.warning(f"Web search error: {e}")
            web_context = "Поиск в интернете временно недоступен."

    system_prompt = f"""Ты — профессиональный ИИ-консультант по градостроительному нормированию Санкт-Петербурга и Ленинградской области.

АБСОЛЮТНЫЕ ПРАВИЛА (НАРУШАТЬ ЗАПРЕЩЕНО):
1. ЦИТИРУЙ ДОСЛОВНО. Когда приводишь нормативные данные из контекста ниже, копируй формулировки из источника СЛОВО В СЛОВО. Не пересказывай, не перефразируй, не округляй цифры.
2. МАРКИРОВКА ОБЯЗАТЕЛЬНОСТИ (ВЫПОЛНЯТЬ ВСЕГДА БЕЗ ИСКЛЮЧЕНИЙ). При КАЖДОМ упоминании нормативного документа ставь эмодзи-маркер СРАЗУ после названия:
   🟢 — обязательный (федеральные законы, ГрК РФ, Технические регламенты, СП из Перечня обязательных ПП РФ №985, региональные НПА: ПЗЗ, РНГП, законы субъектов РФ, Постановления Правительства)
   🟡 — рекомендательный (СП добровольного применения, ГОСТ вне обязательного перечня, методические рекомендации, пособия, руководства)
   ПРИМЕР ОБЯЗАТЕЛЬНОГО ФОРМАТА:
   * **Правила землепользования и застройки Санкт-Петербурга** 🟢 обязательный ([ссылка](URL)) — текст нормы...
   * **Рекомендации по проектированию озеленения** 🟡 рекомендательный ([ссылка](URL)) — текст нормы...
   НИКОГДА НЕ ПРОПУСКАЙ МАРКЕР. Каждый документ в ответе ОБЯЗАН иметь 🟢 или 🟡.
3. ВСЕГДА указывай точный источник: название документа, дату, номер, пункт. Если в тексте источника указан URL — оформи его как ссылку в формате Markdown: [Название документа](URL). НИКОГДА НЕ ВЫДУМЫВАЙ URL, используй только те ссылки, которые есть в тексте ниже!
4. Отвечай СТРУКТУРИРОВАННО: используй списки и выделения.
5. ИГНОРИРУЙ НЕДЕЙСТВУЮЩИЕ И НЕУТВЕРЖДЕННЫЕ ДОКУМЕНТЫ. Ни в коем случае не используй данные, если это "проектное предложение", "презентация", "проект закона" или если документ "утратил силу", "отменен". Ищи только действующие нормативно-правовые акты (НПА).
6. Если запрос слишком широкий — задай 1-2 уточняющих вопроса (территориальная зона, тип объекта, этажность).
7. НЕ ДОДУМЫВАЙ цифры. Если в контексте ниже нет конкретной цифры — так и скажи: «В предоставленных источниках данная информация не найдена», но ОБЯЗАТЕЛЬНО укажи, в каких нормативных документах пользователю следует искать ответ (перечисли конкретные документы: номер, название, пункт/статью).
8. НЕ ПИШИ «воду» и вводные фразы.
9. СТРОГОЕ СООТВЕТСТВИЕ ТЕМЕ ВОПРОСА. Отвечай ТОЛЬКО на тот вопрос, который задан. Используй только те фрагменты контекста, которые НАПРЯМУЮ относятся к вопросу. НЕ ПОДМЕШИВАЙ информацию из других разделов документа, даже если она есть в контексте.
10. ПЕРЕКРЁСТНАЯ ПРОВЕРКА ПО ВСЕМ ДОКУМЕНТАМ. Если вопрос затрагивает несколько нормативных документов (например, ПЗЗ, СНиП/СП, ГОСТ, РНГП, ГрК РФ), ты ОБЯЗАН:
   - Найти требования по данному вопросу во ВСЕХ релевантных документах из контекста.
   - Если требования РАЗЛИЧАЮТСЯ — вывести оба варианта в формате сравнительной таблицы или списка и явно указать: «⚠️ Значения в документах различаются».
   - Если требования СОВПАДАЮТ — написать ответ один раз, но в источниках перечислить ВСЕ документы, которые подтверждают эту норму.
   - Всегда указывать, какой документ имеет приоритет (например, региональный НПА СПб может ужесточать федеральный СП).
11. ЕСЛИ В КОНТЕКСТЕ НЕДОСТАТОЧНО ДАННЫХ, но ты ТОЧНО знаешь ответ из общеизвестных нормативных документов (ГрК РФ, действующие СП, РНГП СПб), ты МОЖЕШЬ дать ответ, но ОБЯЗАН пометить его: «📌 Информация из общей базы знаний (рекомендуется проверить актуальную редакцию документа)» и указать конкретный документ, откуда эта норма.
12. РАСКРЫВАЙ СОДЕРЖАНИЕ КАЖДОГО ДОКУМЕНТА. Если ты упоминаешь нормативный документ в ответе — ты ОБЯЗАН привести из него КОНКРЕТНЫЕ нормативные значения, пункты и требования. ЗАПРЕЩЕНО писать: «не содержит конкретных нормативов» или «может быть полезен для общего понимания». Если документ действительно не содержит данных по теме вопроса — НЕ УПОМИНАЙ его вообще. Упоминай только те документы, из которых ты можешь привести конкретные цифры, требования или нормы.
13. ИЕРАРХИЯ НОРМАТИВНЫХ ДОКУМЕНТОВ. При ответе ВСЕГДА указывай приоритет документов. Документы расположены по убыванию юридической силы:
   ① Федеральные законы (Конституция РФ, ГрК РФ, 384-ФЗ «Технический регламент о безопасности зданий»)
   ② Постановления Правительства РФ (в т.ч. ПП РФ №985 — перечень обязательных СП)
   ③ СП/СНиП из обязательного перечня (ПП РФ №985)
   ④ Региональные законы субъектов РФ (Закон СПб «О зелёных насаждениях», Закон СПб «О ПЗЗ» и др.)
   ⑤ РНГП — Региональные нормативы градостроительного проектирования СПб / ЛО
   ⑥ ПЗЗ — Правила землепользования и застройки (муниципальный уровень)
   ⑦ Постановления Правительства субъекта РФ
   ⑧ СП/СНиП добровольного применения
   ⑨ ГОСТ (если не включён в обязательный перечень)
   ⑩ Методические рекомендации, пособия, руководства
   ВАЖНО: Региональные нормы (④-⑦) могут УЖЕСТОЧАТЬ федеральные (①-③), но НЕ МОГУТ их ослаблять. При конфликте — действует более строгая норма.
   В ответе ВСЕГДА указывай номер приоритета рядом с документом, например: «ПЗЗ СПб ⑥ устанавливает коэффициент 10%, а СП 42.13330 ③ — не менее 6 кв.м/чел».

КОНТЕКСТ ИЗ ЛОКАЛЬНОЙ БАЗЫ НОРМАТИВОВ:
{rag_context}

КОНТЕКСТ ИЗ ОНЛАЙН-ПОИСКА (самая актуальная информация с официальных сайтов):
{web_context}
"""
    
    if client:
        try:
            response = await client.chat.completions.create(
                model=AI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": req.message}
                ],
                temperature=0,
                max_tokens=3000
            )
            ai_text = response.choices[0].message.content

            # --- ДВОЙНАЯ ПРОВЕРКА (верификация ответа, невидимая для пользователя) ---
            try:
                verify_prompt = f"""Ты — строгий верификатор нормативных ответов. Проверь ответ ниже по следующим критериям:

1. ФАКТЧЕК: Есть ли в ответе утверждения, которые НЕ подтверждены контекстом ниже? Если да — укажи какие.
2. ПОЛНОТА: Есть ли в контексте важная информация по теме вопроса, которая НЕ вошла в ответ? Если да — перечисли.  
3. ССЫЛКИ: Все ли URL-ссылки в ответе реально присутствуют в контексте? Нет ли выдуманных ссылок?
4. СТАТУС ДОКУМЕНТОВ: Правильно ли определён статус обязательности (🟢/🟡) для каждого документа?

Вопрос пользователя: {req.message}

ОТВЕТ ДЛЯ ПРОВЕРКИ:
{ai_text}

КОНТЕКСТ (источники):
{rag_context}
{web_context}

Если ошибок НЕТ — выведи ТОЛЬКО слово: VERIFIED
Если нашёл ошибки — перечисли их кратко."""

                verify_response = await client.chat.completions.create(
                    model=AI_MODEL,
                    messages=[
                        {"role": "system", "content": verify_prompt}
                    ],
                    temperature=0,
                    max_tokens=500
                )
                verify_text = verify_response.choices[0].message.content.strip()
                
                if verify_text and "VERIFIED" not in verify_text.upper():
                    # Ошибки найдены — перегенерируем ответ с учётом корректировок
                    logging.info(f"Verification found issues: {verify_text}")
                    corrected_response = await client.chat.completions.create(
                        model=AI_MODEL,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": req.message},
                            {"role": "assistant", "content": ai_text},
                            {"role": "user", "content": f"Внутренняя проверка выявила следующие ошибки в твоём ответе:\n{verify_text}\n\nПерепиши ответ ПОЛНОСТЬЮ, исправив все указанные ошибки. Не упоминай, что была проверка."}
                        ],
                        temperature=0,
                        max_tokens=3000
                    )
                    ai_text = corrected_response.choices[0].message.content
                else:
                    logging.info("Verification passed: VERIFIED")
                    
            except Exception as ve:
                logging.warning(f"Verification step error: {ve}")

            return {"reply": ai_text, "source": "Векторная база + ИИ"}
        except Exception as e:
            logging.error(f"AI Error: {e}")
            return {"reply": f"Ошибка связи с ИИ: {str(e)}", "source": "Система"}
    else:
        return {"reply": "API клиент ИИ не инициализирован. Запустите Ollama или укажите ключ.", "source": "Система"}


@app.get("/api/models")
async def list_models():
    if client:
        return await client.models.list()
    return {"error": "no client"}

@app.post("/api/erp/design/parse_tome")
async def parse_tome(file: UploadFile = File(...)):
    """
    Парсит PDF-том, извлекает текст (PyMuPDF) и с помощью ИИ
    находит Ведомость рабочих чертежей, возвращая массив листов.
    """
    file_bytes = await file.read()
    extracted_text = ""
    if file.filename.lower().endswith(".pdf"):
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc[:5]: # Смотрим первые 5 страниц
                extracted_text += page.get_text("text") + "\n"
        except Exception as e:
            logging.error(f"PyMuPDF error in parse_tome: {e}")
            
    if not extracted_text:
        return {"sheets": []}

    prompt = f"""Найди в тексте ниже "Ведомость рабочих чертежей основного комплекта" (или аналогичный список листов/чертежей).
Выдай результат СТРОГО в виде JSON массива объектов:
[
  {{"sheet_number": "1", "name": "Общие данные"}},
  {{"sheet_number": "2", "name": "Разбивочный план"}}
]
Больше никакого текста, только чистый JSON. Если ведомости нет, верни пустой массив [].
ТЕКСТ:
{extracted_text[:4000]}"""

    if client:
        try:
            res = await client.chat.completions.create(
                model=AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=1000
            )
            text = res.choices[0].message.content.strip()
            # Извлекаем JSON
            import re
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                import json
                sheets = json.loads(json_match.group(0))
                return {"sheets": sheets, "extracted_text": extracted_text}
        except Exception as e:
            logging.error(f"AI Parse Tome Error: {e}")
            return {"sheets": [], "extracted_text": extracted_text, "error": str(e)}

    return {"sheets": [], "extracted_text": extracted_text, "error": "No client available"}

@app.post("/api/erp/design/parse_composition")
async def parse_composition(file: UploadFile = File(...)):
    """
    Парсит файл состава проекта (Excel или PDF) и извлекает список разделов.
    """
    file_bytes = await file.read()
    extracted_text = ""
    
    filename_lower = file.filename.lower()
    if filename_lower.endswith(".pdf"):
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc[:10]:
                extracted_text += page.get_text("text") + "\n"
        except Exception as e:
            logging.error(f"PyMuPDF error in parse_composition: {e}")
    elif filename_lower.endswith((".xls", ".xlsx")):
        try:
            import openpyxl
            import io
            wb = openpyxl.load_workbook(filename=io.BytesIO(file_bytes), data_only=True)
            sections = []
            for sheet in wb.worksheets:
                for row in sheet.iter_rows(values_only=True):
                    # We assume Cipher is in Column B (index 1) and Name is in Column C (index 2)
                    # Or Column A and B. Let's just look for two consecutive string cells that look like our data.
                    # Based on user's screenshot, it's index 1 (Шифр) and index 2 (Наименование)
                    if len(row) > 2:
                        cipher = str(row[1]).strip() if row[1] else ""
                        name = str(row[2]).strip() if row[2] else ""
                        if cipher and name and cipher.lower() != "none" and name.lower() != "none":
                            if "шифр" not in cipher.lower() and len(cipher) > 2 and len(name) > 3:
                                # Looks like a valid row
                                sections.append({"id": cipher, "name": name})
            if sections:
                return {"sections": sections}
        except Exception as e:
            logging.error(f"openpyxl error in parse_composition: {e}")

    if not extracted_text.strip():
        return {"sections": []}

    prompt = f"""Найди в тексте ниже полный список томов/разделов рабочей документации (Состав проекта).
Выдай результат СТРОГО в виде JSON массива объектов:
[
  {{"id": "3/0824-AP1", "name": "Архитектурные решения выше 0.000"}},
  {{"id": "3/0824-AP2.1", "name": "Архитектурные решения. Кровля"}}
]
ПРАВИЛА:
1. В поле 'id' укажи ТОЧНЫЙ шифр тома из текста (например 3/0824-AP1, 3/0824-AP2.1). 
2. В 'name' — точное наименование этого тома из текста.
3. НЕ ГРУППИРУЙ разные тома одной марки (например АР1, АР2.1, АР3) в один общий раздел. Абсолютно каждый шифр/том из таблицы (например 3/0824-ГП, 3/0824-КЖ0, 162-19-38-Р-КЖ0-1) должен быть отдельным элементом в массиве JSON.
4. Выведи ВСЕ найденные тома без исключения (их может быть 50+ штук).
Больше никакого текста, только чистый JSON. Если разделов нет, верни пустой массив [].
ТЕКСТ:
{extracted_text[:15000]}"""

    if client:
        try:
            res = await client.chat.completions.create(
                model=AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=2000
            )
            text = res.choices[0].message.content.strip()
            import re
            import json
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                sections = json.loads(json_match.group(0))
                return {"sections": sections}
        except Exception as e:
            logging.error(f"AI Parse Composition Error: {e}")
            return {"sections": [], "error": str(e)}

    return {"sections": [], "error": "No client available"}

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
        
    # 1. Поиск в Векторной базе
    rag_context = ""
    try:
        results = search_norms(query)
        if results and results['documents'] and len(results['documents'][0]) > 0:
            rag_context = "Найденные нормативы из локальной базы:\n" + "\n---\n".join(results['documents'][0])
        else:
            rag_context = "В локальной базе нормативов ничего не найдено."
    except Exception as e:
        logging.warning(f"ChromaDB error: {e}")
        rag_context = "Локальная база недоступна."

    # 2. Поиск в Интернете по доверенным сайтам
    web_context = ""
    try:
        web_text = await get_web_context(query)
        if web_text:
            web_context = "Найденные актуальные регламенты в ИНТЕРНЕТЕ:\n" + web_text
        else:
            web_context = "В интернете на доверенных сайтах точного ответа не найдено."
    except Exception as e:
        logging.warning(f"Web search error: {e}")
        web_context = "Поиск в интернете недоступен."

    system_prompt = f"""Ты эксперт по градостроительным согласованиям Санкт-Петербурга и Ленинградской области.
Пользователь запрашивает дорожную карту для процедуры.

СТРОГИЕ ПРАВИЛА:
1. ОТКАЗ ПРИ ОТСУТСТВИИ ДАННЫХ: Если в предоставленном ниже контексте нет реальной информации о запрашиваемой процедуре, верни JSON с одним шагом: {{"title": "Информация не найдена", "desc": "В базе данных нет достоверных регламентов для этой процедуры.", "meta": ""}}. 
2. НИКАКИХ ГАЛЛЮЦИНАЦИЙ: ЗАПРЕЩЕНО выдумывать номера СП, ГОСТов, Постановлений и законов. Упоминай только те документы, которые ПРЯМО НАПИСАНЫ в контексте ниже.
3. ХРОНОЛОГИЯ: Шаги должны идти в строгом логическом порядке (например: ТУ -> Проектирование -> Экспертиза -> Разрешение на строительство).
4. Указывай точные сроки согласований, только если они есть в документах.
5. Обязательно указывай ссылки на НПА в описании, ТОЛЬКО если они есть в контексте.

Сгенерируй ответ СТРОГО в формате JSON без какого-либо текста до или после. JSON обязан содержать поле "_thinking", где ты сначала анализируешь контекст, выстраиваешь хронологию и проверяешь, не выдумал ли ты нормативы:
{{
  "_thinking": "Кратко проанализируй контекст. Укажи, какие именно реальные документы из контекста ты берешь. Проверь логику шагов.",
  "title": "Точное название процедуры",
  "authority": "Главное ведомство (например, Госстройнадзор или КГА)",
  "steps": [
    {{
      "title": "Название шага 1",
      "desc": "Подробное описание действий",
      "meta": "Срок (например: 30 дней)",
      "sources": ["https://url-источника-из-контекста.ru"]
    }}
  ]
}}
ВАЖНО: В поле "sources" каждого шага ОБЯЗАТЕЛЬНО укажи URL-адреса из КОНТЕКСТА (строки ИСТОЧНИК:), на основе которых ты составил этот шаг. Если для шага нет URL — оставь пустой массив [].

КОНТЕКСТ ДЛЯ СОСТАВЛЕНИЯ КАРТЫ:
{rag_context}
{web_context}
"""

    try:
        response = await client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.0,
            max_tokens=3000
        )
        ai_text = response.choices[0].message.content
        
        # Улучшенное извлечение JSON из любого текста
        import re
        json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
        if json_match:
            ai_text = json_match.group(0)
        else:
            # Fallback
            if "```json" in ai_text:
                ai_text = ai_text.split("```json")[1].split("```")[0].strip()
            elif "```" in ai_text:
                ai_text = ai_text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(ai_text)
        # Убираем внутреннее поле _thinking (оно только для самопроверки ИИ)
        data.pop('_thinking', None)
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
