from tavily import TavilyClient
import logging
import os

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

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

async def get_web_context(query: str) -> str:
    """
    Ищет актуальную информацию через Tavily API по доверенным сайтам.
    Возвращает собранный текст для передачи в LLM.
    """
    if not TAVILY_API_KEY:
        logging.warning("TAVILY_API_KEY not set")
        return ""

    try:
        client = TavilyClient(api_key=TAVILY_API_KEY)
        
        response = client.search(
            query=f"{query} действующая редакция градостроительство СПб нормативы",
            search_depth="advanced",
            include_domains=TRUSTED_DOMAINS,
            max_results=5,
            include_raw_content=False
        )
        
        results = response.get("results", [])
        if not results:
            logging.info("Tavily: no results from trusted domains")
            return ""

        context_parts = []
        for res in results:
            url = res.get("url", "")
            title = res.get("title", "")
            content = res.get("content", "")
            
            # Строгая проверка домена (иногда API игнорирует include_domains)
            domain_matched = any(domain in url for domain in TRUSTED_DOMAINS)
            if not domain_matched:
                logging.warning(f"Tavily returned unapproved domain: {url}")
                continue
                
            # Проверка на недействующие документы (устаревшие СНиП, отмененные законы)
            combined_text = (title + " " + content).lower()
            if "недействующий" in combined_text or "утратил силу" in combined_text or "отменен" in combined_text:
                logging.info(f"Filtered out invalid document: {url}")
                continue
            
            context_parts.append(
                f"ИСТОЧНИК: {url}\n"
                f"ЗАГОЛОВОК: {title}\n"
                f"СОДЕРЖАНИЕ: {content}"
            )
            
            # Ограничиваем до 3 валидных результатов
            if len(context_parts) >= 3:
                break

        return "\n\n---\n\n".join(context_parts)

    except Exception as e:
        logging.error(f"Tavily Search Error: {e}")
        return ""
