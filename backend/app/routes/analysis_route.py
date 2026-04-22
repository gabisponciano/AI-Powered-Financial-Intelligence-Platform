from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, time
from app.dependencies import get_db, get_df_from_db
from app.models import Transaction


analysis_router = APIRouter(prefix="/analysis", tags=["analysis"])

@analysis_router.get("/kpis")
def kpis(upload_id: int = Query(...), db: Session = Depends(get_db)):

    df = get_df_from_db(db, upload_id)

    if df.empty:
        return {"error": "Nenhum dado encontrado"}

    total_receita = df[df["status"] == "pago"]["amount"].sum()
    ticket_medio = df[df["status"] == "pago"]["amount"].mean()
    total_transacoes = len(df)
    inadimplentes = len(df[df["status"] == "atrasado"])
    taxa_inadimplencia = (inadimplentes / total_transacoes * 100) if total_transacoes > 0 else 0
    pendentes = df[df["status"] == "pendente"]["amount"].sum()

    return {
        "receita_total": round(total_receita, 2),
        "ticket_medio": round(ticket_medio, 2),
        "total_transacoes": total_transacoes,
        "taxa_inadimplencia": round(taxa_inadimplencia, 2),
        "valor_pendente": round(pendentes, 2),
        "inadimplentes_count": inadimplentes,
    }


@analysis_router.get("/evolucao")
def evolucao(upload_id: int = Query(...), db: Session = Depends(get_db)):

    df = get_df_from_db(db, upload_id)

    if df.empty:
        return []

    df = df.copy()
    df["mes"] = df["date"].dt.to_period("M").astype(str)

    grouped = (
        df.groupby(["mes", "status"])["amount"]
        .sum()
        .reset_index()
        .rename(columns={"amount": "total"})
    )

    pivot = grouped.pivot(index="mes", columns="status", values="total").fillna(0).reset_index()

    return pivot.to_dict(orient="records")


@analysis_router.get("/por-cliente")
def por_cliente(upload_id: int = Query(...), db: Session = Depends(get_db)):

    df = get_df_from_db(db, upload_id)

    if df.empty:
        return []

    pago = df[df["status"] == "pago"].groupby("customer")["amount"].sum().reset_index()
    pago.columns = ["cliente", "receita"]

    return pago.sort_values("receita", ascending=False).to_dict(orient="records")



@analysis_router.get("/por-categoria")
def por_categoria(upload_id: int = Query(...), db: Session = Depends(get_db)):

    df = get_df_from_db(db, upload_id)

    if df.empty or "category" not in df.columns:
        return []

    cat = df.groupby("category")["amount"].sum().reset_index()
    cat.columns = ["categoria", "total"]

    return cat.sort_values("total", ascending=False).to_dict(orient="records")


@analysis_router.get("/anomalias")
def anomalias(upload_id: int = Query(...), db: Session = Depends(get_db)):

    df = get_df_from_db(db, upload_id)

    if df.empty:
        return []

    mean = df["amount"].mean()
    std = df["amount"].std()

    anomalias = df[df["amount"] > mean + 2 * std].copy()
    anomalias["motivo"] = "Valor muito acima da média"

    return anomalias.head(10).to_dict(orient="records")


@analysis_router.get("/transacoes")
def transacoes(
    upload_id: int = Query(...),
    status: str | None = Query(None),
    q: str | None = Query(None, description="Busca por texto em cliente/descrição/categoria"),
    customer: str | None = Query(None),
    category: str | None = Query(None),
    min_amount: float | None = Query(None),
    max_amount: float | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    sort_by: str = Query("date"),
    sort_dir: str = Query("desc"),
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).filter(Transaction.upload_id == upload_id)

    if status:
        query = query.filter(Transaction.status == status)

    if customer:
        pattern = f"%{customer.strip().lower()}%"
        query = query.filter(func.lower(Transaction.customer).like(pattern))

    if category:
        pattern = f"%{category.strip().lower()}%"
        query = query.filter(func.lower(Transaction.category).like(pattern))

    if q:
        pattern = f"%{q.strip().lower()}%"
        query = query.filter(
            func.lower(Transaction.customer).like(pattern)
            | func.lower(Transaction.description).like(pattern)
            | func.lower(Transaction.category).like(pattern)
        )

    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)

    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)

    if start_date:
        query = query.filter(Transaction.date >= datetime.combine(start_date, time.min))

    if end_date:
        query = query.filter(Transaction.date <= datetime.combine(end_date, time.max))

    sort_map = {
        "date": Transaction.date,
        "amount": Transaction.amount,
        "customer": Transaction.customer,
        "status": Transaction.status,
        "category": Transaction.category,
        "id": Transaction.id,
    }
    sort_col = sort_map.get(sort_by, Transaction.date)
    if sort_dir.lower() == "asc":
        query = query.order_by(sort_col.asc(), Transaction.id.asc())
    else:
        query = query.order_by(sort_col.desc(), Transaction.id.desc())

    total = query.order_by(None).count()
    items = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": t.id,
                "date": t.date.isoformat() if t.date else None,
                "amount": t.amount,
                "status": t.status,
                "customer": t.customer,
                "description": t.description,
                "category": t.category,
            }
            for t in items
        ],
    }
