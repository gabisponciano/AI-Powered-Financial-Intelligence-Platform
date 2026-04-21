from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import  Document
import os
import pandas as pd

def build_retriever_from_db(transactions):
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    documents = []
    ids = []

    for t in transactions:
        content = (
            f"Data: {t.date} | "
            f"Valor: {t.amount} | "
            f"Descrição: {t.description or ''} | "
            f"Categoria: {t.category or ''} | "
            f"Status: {t.status or ''} | "
            f"Cliente: {t.customer or ''}"
        )
        documents.append(Document(page_content=content, id=str(t.id)))
        ids.append(str(t.id))

    # Sem persistência — reconstrói em memória sempre atualizado
    vector_store = Chroma(
        collection_name="transactions",
        embedding_function=embeddings
    )
    vector_store.add_documents(documents=documents, ids=ids)

    return vector_store.as_retriever(search_kwargs={"k": 5})