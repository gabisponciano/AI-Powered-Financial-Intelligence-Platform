from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.databases.database import Base


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="upload")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"), index=True)

    amount = Column(Float)
    date = Column(DateTime)
    status = Column(String)

    customer = Column(String)
    description = Column(String)

    raw_data = Column(JSON, nullable=True)

    upload = relationship("Upload", back_populates="transactions")