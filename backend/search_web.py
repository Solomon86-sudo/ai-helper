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
            query=f"{query} градостроительство СПб нормативы",
            search_depth="advanced",
            include_domains=TRUSTED_DOMAINS,
            max_results=3,
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
            
            context_parts.append(
                f"ИСТОЧНИК: {url}\n"
                f"ЗАГОЛОВОК: {title}\n"
                f"СОДЕРЖАНИЕ: {content}"
            )

        return "\n\n---\n\n".join(context_parts)

    except Exception as e:
        logging.error(f"Tavily Search Error: {e}")
        return ""
