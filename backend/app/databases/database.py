from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Default DB lives at backend/database.db (repo convention with alembic.ini).
# This file is located at backend/app/databases/database.py, so go up 2 levels.
DB_PATH = os.path.join(BASE_DIR, "..", "..", "database.db")

DATABASE_URL = f"sqlite:///{os.path.abspath(DB_PATH)}"

db = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=db, autoflush=False, autocommit=False)

Base = declarative_base()


def init_db() -> None:
    # Ensure all model metadata is registered before creating tables.
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=db)
