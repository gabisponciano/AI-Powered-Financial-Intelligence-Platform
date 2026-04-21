from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import pandas as pd
import io
from app.dependencies import get_db
from app.models import Upload, Transaction
from app.services.preprocessing import normalize_dataframe
from sqlalchemy.orm import Session

upload_router = APIRouter(prefix="/upload", tags=["upload"])

@upload_router.post("/upload")
async def upload_file(file: UploadFile = File(...), session: Session = Depends(get_db)):
    content = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(content))
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(content))
    else:
        raise HTTPException(status_code=400, detail="Formato não suportado. Envie .csv ou .xlsx")

    df.columns = df.columns.str.lower()
    df = normalize_dataframe(df)

    upload = Upload(
        filename=file.filename,
        status="processing"
    )

    session.add(upload)
    session.commit()
    session.refresh(upload)

    upload_id = upload.id

    transactions = []

    for _, row in df.iterrows():
        t = Transaction(
            upload_id=upload.id,
            amount=float(row.get("amount", 0)) if pd.notna(row.get("amount")) else None,
            date=pd.to_datetime(row.get("date")) if pd.notna(row.get("date")) else None,
            status=row.get("status"),
            customer=row.get("customer"),
            description=row.get("description"),
            category=row.get("category"),
            anomaly=0,
            raw_data=row.to_dict()
        )
        transactions.append(t)

    session.bulk_save_objects(transactions)
    session.commit()

    upload.status = "done"
    session.commit()

    return {
        "message": "Arquivo recebido e em processamento",
        "upload_id": upload_id,
        "columns": list(df.columns),
        "preview": df.head(5).to_dict()
    }