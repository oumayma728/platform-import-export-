from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.config.config import settings
from app.routes.api import api_router
from app.config.database import engine, Base

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not connect to database at startup: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes.messaging import ws_router

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)

upload_dir = os.path.join(os.getcwd(), "uploads", "documents")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/documents", StaticFiles(directory=upload_dir), name="documents")

static_dir = os.path.join(os.getcwd(), "static")
if os.path.exists(static_dir):
    app.mount("/test-ui", StaticFiles(directory=static_dir, html=True), name="test-ui")

@app.get("/")
def root():
    return {"message": "Bienvenue sur l'API platform-import-export (FastAPI)"}
