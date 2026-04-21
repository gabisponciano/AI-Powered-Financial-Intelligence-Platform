from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import Transaction
from app.services.rag_service import rag_config
from app.services.vector import build_retriever_from_db

rag_router = APIRouter(prefix="/rag", tags=["rag"])

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
    
    retriever = build_retriever_from_db(transactions)
    docs = retriever.invoke(payload.question)
    context = "\n".join([doc.page_content for doc in docs])
    
    answer = rag_config(context, payload.question)
    return {"answer": answer, "sources_used": len(docs)}