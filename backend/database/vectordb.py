import os
import chromadb
from chromadb.config import Settings

# Инициализация локальной базы данных ChromaDB
# Данные будут сохраняться в папке ./chroma_data
client = chromadb.PersistentClient(path=os.path.join(os.path.dirname(__file__), "chroma_data"))

# Создаем или получаем коллекцию для нормативной базы СПБ и ЛО
norms_collection = client.get_or_create_collection(
    name="spb_norms_knowledge_base",
    metadata={"hnsw:space": "cosine"}
)

def add_document(doc_id: str, text: str, metadata: dict):
    """
    Добавление документа (ПЗЗ, ГрК, СП) в векторную базу
    """
    norms_collection.add(
        documents=[text],
        metadatas=[metadata],
        ids=[doc_id]
    )

def search_norms(query: str, n_results: int = 3):
    """
    Поиск релевантных фрагментов нормативной базы
    """
    results = norms_collection.query(
        query_texts=[query],
        n_results=n_results
    )
    return results
