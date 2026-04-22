from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from typing import List, Optional
import os


PERSIST_DIR = "./chroma_db"


def build_retriever_from_db(transactions: List, upload_id: Optional[int] = None, k: int = 20):
    """
    Cria ou atualiza um vector store com transações
    e retorna um retriever semântico filtrado por upload_id.
    """

    try:
        embeddings = OllamaEmbeddings(
            model="nomic-embed-text"
        )
        collection_name = f"transactions_{upload_id}" if upload_id else "transactions_all"

        vector_store = Chroma(
            collection_name=collection_name,
            persist_directory=PERSIST_DIR,
            embedding_function=embeddings,
        )

        documents = []
        ids = []

        for t in transactions:
            doc_id = f"{t.upload_id}_{t.id}" if hasattr(t, "upload_id") and t.upload_id else t.id

            content = (
                f"Transação realizada em {t.date}. "
                f"Valor de {t.amount} reais. "
                f"Descrição: {t.description or 'não informada'}. "
                f"Categoria: {t.category or 'não informada'}. "
                f"Status: {t.status or 'não informado'}. "
                f"Cliente: {t.customer or 'não informado'}."
            )

            metadata = {
                "upload_id": t.upload_id,
                "transaction_id": t.id,
                "date": t.date,
                "amount": t.amount,
                "category": t.category or "",
                "status": t.status or "",
                "customer": t.customer or "",
            }

            documents.append(
                Document(
                    page_content=content,
                    metadata=metadata,
                    id=doc_id
                )
            )

            ids.append(doc_id)

        if ids:
            existing = vector_store.get(ids=ids)
            existing_ids = set(existing.get("ids", [])) if existing else set()

            new_docs = []
            new_ids = []

            for doc, doc_id in zip(documents, ids):
                if doc_id not in existing_ids:
                    new_docs.append(doc)
                    new_ids.append(doc_id)

            if new_docs:
                vector_store.add_documents(documents=new_docs, ids=new_ids)

        k_final = min(k, len(transactions))

        search_kwargs = {
            "k": k_final
        }

        if upload_id is not None:
            search_kwargs["filter"] = {"upload_id": upload_id}

        return vector_store.as_retriever(
            search_type="similarity",
            search_kwargs=search_kwargs
        )

    except Exception as e:
        print(f"[ERRO build_retriever]: {e}")
        raise