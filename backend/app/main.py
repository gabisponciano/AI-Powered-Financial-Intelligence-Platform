from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes.upload_route import upload_router
from app.routes.analysis_route import analysis_router
from app.routes.llm_analysis_route import llm_analysis_router
from app.routes.rag_route import rag_router

app.include_router(upload_router)
app.include_router(analysis_router)
app.include_router(llm_analysis_router)
app.include_router(rag_router)