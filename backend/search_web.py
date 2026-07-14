from tavily import TavilyClient
import logging
import os

# Список доверенных доменов
# Группа 1: Правовые базы и НТД
TRUSTED_DOMAINS_LEGAL = [
    "docs.cntd.ru",         # Электронный фонд НТД (Техэксперт)
    "base.garant.ru",       # Гарант — правовая база
    "consultant.ru",        # КонсультантПлюс
    "pravo.gov.ru",         # Официальный портал правовой информации РФ
]

# Группа 2: Федеральные органы (стандарты, регламенты)
TRUSTED_DOMAINS_FEDERAL = [
    "minstroyrf.gov.ru",    # Минстрой России
    "rst.gov.ru",           # Росстандарт (ГОСТ, стандарты)
    "faufcc.ru",            # ФАУ ФЦС (реестр СП, нормирование)
    "nostroy.ru",           # НОСТРОЙ (национальное объединение строителей)
]

# Группа 3: Региональные (СПб + ЛО)
TRUSTED_DOMAINS_REGIONAL = [
    "npa.gov.spb.ru",       # НПА Санкт-Петербурга
    "www.gov.spb.ru",       # Правительство СПб
    "kgainfo.spb.ru",       # КГА СПб
    "gsnspb.ru",            # Госстройнадзор СПб
    "kgsn.lenobl.ru",       # Госстройнадзор ЛО
    "szap.gosnadzor.ru",    # Ростехнадзор СЗФО
    "arch.lenobl.ru",       # Комитет архитектуры ЛО
]

TRUSTED_DOMAINS = TRUSTED_DOMAINS_LEGAL + TRUSTED_DOMAINS_FEDERAL + TRUSTED_DOMAINS_REGIONAL

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

async def get_web_context(query: str) -> str:
    """
    Ищет актуальную информацию через Tavily API по доверенным сайтам.
    Использует несколько вариантов запроса для максимального охвата.
    Возвращает собранный текст для передачи в LLM.
    """
    if not TAVILY_API_KEY:
        logging.warning("TAVILY_API_KEY not set")
        return ""

    try:
        client = TavilyClient(api_key=TAVILY_API_KEY)
        
        # Несколько вариантов запроса для максимального охвата
        search_queries = [
            f"{query} действующая редакция",
            f"{query} СП СНиП норматив требования",
            f"{query} ПЗЗ РНГП Санкт-Петербург Ленинградская область",
        ]
        
        all_results = []
        seen_urls = set()
        
        for sq in search_queries:
            try:
                response = client.search(
                    query=sq,
                    search_depth="advanced",
                    include_domains=TRUSTED_DOMAINS,
                    max_results=5,
                    include_raw_content=False
                )
                for res in response.get("results", []):
                    url = res.get("url", "")
                    if url not in seen_urls:
                        seen_urls.add(url)
                        all_results.append(res)
            except Exception as e:
                logging.warning(f"Tavily sub-query error for '{sq}': {e}")
                continue
        
        if not all_results:
            logging.info("Tavily: no results from any query variant")
            return ""

        context_parts = []
        for res in all_results:
            url = res.get("url", "")
            title = res.get("title", "")
            content = res.get("content", "")
            
            # Строгая проверка домена (иногда API игнорирует include_domains)
            domain_matched = any(domain in url for domain in TRUSTED_DOMAINS)
            if not domain_matched:
                logging.warning(f"Tavily returned unapproved domain: {url}")
                continue
                
            # Проверка на недействующие документы и проекты/презентации
            combined_text = (title + " " + content + " " + url).lower()
            invalid_keywords = [
                "недействующий", 
                "утратил силу", 
                "отменен",
                "проектное предложение",
                "проектное_предложение",
                "презентация",
                "проект закона",
                "проект постановления",
                "проект изменений"
            ]
            if any(kw in combined_text for kw in invalid_keywords):
                logging.info(f"Filtered out invalid/draft document: {url}")
                continue
            
            context_parts.append(
                f"ИСТОЧНИК: {url}\n"
                f"ЗАГОЛОВОК: {title}\n"
                f"СОДЕРЖАНИЕ: {content}"
            )
            
            # Ограничиваем до 5 валидных результатов
            if len(context_parts) >= 5:
                break

        return "\n\n---\n\n".join(context_parts)

    except Exception as e:
        logging.error(f"Tavily Search Error: {e}")
        return ""
