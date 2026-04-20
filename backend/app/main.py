from fastapi import FastAPI
from dotenv import load_dotenv
import os

app = FastAPI()

from app.routes.upload_route import upload_router
from app.routes.analysis_route import analysis_router
from app.routes.llm_analysis_route import llm_analysis_router

app.include_router(upload_router)
app.include_router(analysis_router)
app.include_router(llm_analysis_router)