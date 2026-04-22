from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.databases.dependencies import get_db
from app.models import Transaction
from app.services.rag_service import rag_config
from app.databases.vector import build_retriever_from_db

rag_router = APIRouter(prefix="/rag", tags=["rag"])

# Palavras-chave que indicam perguntas de agregação (precisam de mais contexto)
AGGREGATE_KEYWORDS = [
    "total", "soma", "somar", "quantas", "quanto", "média",
    "maior", "menor", "mais alto", "mais baixo", "todas", "todos"
]

class QuestionRequest(BaseModel):
    question: str
    upload_id: int | None = None  # None = todos os uploads

@rag_router.post("/ask")
def ask(payload: QuestionRequest, session: Session = Depends(get_db)):
    query = session.query(Transaction)

    if payload.upload_id:
        query = query.filter(Transaction.upload_id == payload.upload_id)

    transactions = query.all()

    if not transactions:
        raise HTTPException(status_code=404, detail="Nenhuma transação encontrada")

    question_lower = payload.question.lower()
    is_aggregate = any(kw in question_lower for kw in AGGREGATE_KEYWORDS)
    k = 80 if is_aggregate else 30

    retriever = build_retriever_from_db(
        transactions=transactions,
        upload_id=payload.upload_id,
        k=k
    )

    docs = retriever.invoke(payload.question)
    context = "\n".join([doc.page_content for doc in docs])

    answer = rag_config(context, payload.question)
    return {
        "answer": answer,
        "sources_used": len(docs),
        "upload_id_filter": payload.upload_id,
        "aggregate_mode": is_aggregate
    }