from sqlalchemy.orm import sessionmaker, Session
from app.database import db
from app.models import Transaction
import pandas as pd
from app.database import SessionLocal

def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def get_df_from_db(db: Session, upload_id: int):
    data = db.query(Transaction).filter(Transaction.upload_id == upload_id).all()
    if not data:
        return pd.DataFrame()

    df = pd.DataFrame([t.__dict__ for t in data])
    df = df.drop(columns=["_sa_instance_state"], errors="ignore")

    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")

    return df