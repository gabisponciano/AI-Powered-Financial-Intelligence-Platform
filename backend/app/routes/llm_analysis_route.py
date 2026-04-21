from fastapi import APIRouter, Query, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_df_from_db
from app.models import Transaction
from app.services.llm_service import (
    classify_transaction,
    classify_transactions_batch,
    generate_insights,
    explain_anomalies,
    natural_language_query,
    build_df_summary,
)

llm_analysis_router = APIRouter(prefix="/llm_analysis", tags=["llm_analysis"])


@llm_analysis_router.post("/classify")
def classify_single(
    payload: dict = Body(..., example={
        "description": "Pagamento de licença de software",
        "amount": 1500.00,
        "customer": "Empresa XYZ"
    })
):
    """
    Classifica UMA transação em uma categoria usando o LLaMA 3.
    Útil para categorizar transações novas em tempo real.
    """
    description = payload.get("description", "")
    amount = float(payload.get("amount", 0))
    customer = payload.get("customer", "")
 
    if not description:
        raise HTTPException(status_code=400, detail="Campo 'description' é obrigatório.")
 
    try:
        category = classify_transaction(description, amount, customer)
        return {"category": category}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
 

 
@llm_analysis_router.get("/insights")
def insights(upload_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Gera 4 insights automáticos sobre o upload usando o LLaMA 3.
    Combina KPIs, evolução temporal e top clientes para contextualizar o modelo.
    """
    df = get_df_from_db(db, upload_id)
 
    if df.empty:
        raise HTTPException(status_code=404, detail="Nenhum dado encontrado para este upload.")
 
    # Recalcula KPIs localmente (sem repetir requisição HTTP)
    total_transacoes = len(df)
    pago_df = df[df["status"] == "pago"]
    inadimplentes = len(df[df["status"] == "atrasado"])
 
    kpis_data = {
        "receita_total": round(float(pago_df["amount"].sum()), 2),
        "ticket_medio": round(float(pago_df["amount"].mean()), 2) if not pago_df.empty else 0,
        "total_transacoes": total_transacoes,
        "taxa_inadimplencia": round((inadimplentes / total_transacoes * 100), 2) if total_transacoes > 0 else 0,
        "valor_pendente": round(float(df[df["status"] == "pendente"]["amount"].sum()), 2),
        "inadimplentes_count": inadimplentes,
    }
 
    # Evolução mensal resumida
    evolucao_data = []
    if "date" in df.columns:
        df_evo = df.copy()
        df_evo["mes"] = df_evo["date"].dt.to_period("M").astype(str)
        grouped = df_evo.groupby("mes")["amount"].sum().reset_index()
        evolucao_data = grouped.to_dict(orient="records")
 
    # Top clientes
    top_clientes_data = []
    if "customer" in df.columns:
        top = pago_df.groupby("customer")["amount"].sum().nlargest(5).reset_index()
        top.columns = ["cliente", "receita"]
        top_clientes_data = top.to_dict(orient="records")
 
    try:
        result = generate_insights(kpis_data, evolucao_data, top_clientes_data)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
 
 
@llm_analysis_router.get("/anomalias-ia")
def anomalias_ia(upload_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Detecta anomalias estatisticamente (média + 2σ) e enriquece cada anomalia
    com uma explicação em linguagem natural gerada pelo LLaMA 3.
    """
    df = get_df_from_db(db, upload_id)
 
    if df.empty:
        raise HTTPException(status_code=404, detail="Nenhum dado encontrado.")
 
    mean = float(df["amount"].mean())
    std = float(df["amount"].std())
    threshold = mean + 2 * std
 
    anomalias_df = df[df["amount"] > threshold].copy()
 
    if anomalias_df.empty:
        return {"anomalias": [], "message": "Nenhuma anomalia detectada no período."}
 
    # Converte para lista de dicts (serialização segura)
    anomalias_list = []
    for row in anomalias_df.head(10).itertuples():
        anomalias_list.append({
            "id": getattr(row, "id", None),
            "amount": getattr(row, "amount", None),
            "customer": getattr(row, "customer", None),
            "description": getattr(row, "description", None),
            "date": str(getattr(row, "date", "")) if getattr(row, "date", None) else None,
            "status": getattr(row, "status", None),
            "category": getattr(row, "category", None),
        })
 
    stats = {"mean": mean, "std": std, "threshold": threshold}
 
    try:
        enriched = explain_anomalies(anomalias_list, stats)
        return {
            "total_anomalias": len(anomalias_df),
            "limiar": round(threshold, 2),
            "media": round(mean, 2),
            "desvio_padrao": round(std, 2),
            "anomalias": enriched,
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
 
 
@llm_analysis_router.post("/query")
def query_natural_language(
    upload_id: int = Query(...),
    payload: dict = Body(..., example={"question": "Quais clientes têm maior risco de inadimplência?"}),
    db: Session = Depends(get_db),
):
    """
    Responde perguntas em linguagem natural sobre as transações do upload.
    O LLaMA 3 recebe um sumário estatístico dos dados (não a tabela inteira)
    e responde a pergunta do usuário de forma objetiva.
    """
    question = payload.get("question", "").strip()
 
    if not question:
        raise HTTPException(status_code=400, detail="Campo 'question' é obrigatório.")
 
    df = get_df_from_db(db, upload_id)
 
    if df.empty:
        raise HTTPException(status_code=404, detail="Nenhum dado encontrado para este upload.")
 
    summary = build_df_summary(df)
 
    try:
        answer = natural_language_query(question, summary)
        return {
            "question": question,
            "answer": answer,
            "context_used": summary,
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
