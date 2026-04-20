from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_df_from_db


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

 
