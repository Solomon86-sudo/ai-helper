from duckduckgo_search import DDGS
from bs4 import BeautifulSoup
import httpx
import logging
import asyncio

# Список доверенных доменов (пользовательский выбор)
TRUSTED_DOMAINS = [
    "docs.cntd.ru",
    "npa.gov.spb.ru",
    "base.garant.ru",
    "www.gov.spb.ru",
    "kgsn.lenobl.ru",
    "szap.gosnadzor.ru",
    "arch.lenobl.ru",
    "kgainfo.spb.ru",
    "gsnspb.ru"
]

def build_search_query(user_query: str) -> str:
    # Добавляем ограничение по сайтам
    sites = " OR ".join([f"site:{domain}" for domain in TRUSTED_DOMAINS])
    return f"({sites}) {user_query}"

def perform_web_search(query: str, max_results: int = 3) -> list:
    """
    Выполняет поиск в DuckDuckGo по доверенным сайтам.
    Возвращает список ссылок и сниппетов.
    """
    search_query = build_search_query(query)
    logging.info(f"Выполняю веб-поиск: {search_query}")
    
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(search_query, region='ru-ru', safesearch='off', max_results=max_results):
                results.append({
                    "title": r.get("title", ""),
                    "href": r.get("href", ""),
                    "body": r.get("body", "")
                })
    except Exception as e:
        logging.error(f"DDGS Search Error: {e}")
    return results

async def fetch_page_text(url: str) -> str:
    """
    Скачивает HTML страницы и вытаскивает текст.
    """
    try:
        # Используем httpx для асинхронного запроса
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            # Маскируемся под браузер, чтобы обойти простую защиту
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            }
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                # Удаляем скрипты и стили
                for script in soup(["script", "style"]):
                    script.extract()
                text = soup.get_text(separator=' ', strip=True)
                # Берем только первые 3000 символов, чтобы не перегрузить контекст ИИ
                return text[:3000]
            return ""
    except Exception as e:
        logging.warning(f"Error fetching {url}: {e}")
        return ""

async def get_web_context(query: str) -> str:
    """
    Основная функция: ищет в интернете и возвращает собранный текст.
    """
    search_results = perform_web_search(query, max_results=2)
    if not search_results:
        return ""
    
    context_parts = []
    for res in search_results:
        url = res["href"]
        snippet = res["body"]
        # Скачиваем саму страницу для подробностей
        page_text = await fetch_page_text(url)
        
        context_parts.append(f"ИСТОЧНИК: {url}\nСНИППЕТ ИЗ ПОИСКОВИКА: {snippet}\nТЕКСТ СТРАНИЦЫ: {page_text}...")
        
    return "\n\n---\n\n".join(context_parts)
