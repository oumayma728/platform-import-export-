from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes import auth, listings, conversations, billing, notifications, webhooks, integrations, favorites, matching, payments_alias, accounts, invoices_alias, reference_options
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.background import BackgroundScheduler
from app.config.database import SessionLocal
from app.config.database_startup import run_database_migrations
from app.services.notification_service import retry_failed_notifications
import os
from app.routes import auth, listings, conversations, billing, notifications, webhooks, integrations, favorites, matching, payments_alias, invoices_alias, accounts, reference_options
from app.routes.webhooks import router as webhooks_router

load_dotenv()

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[DATABASE] Initialisation...")
    try:
        run_database_migrations()
    except Exception as exc:
        print(f"[DATABASE] Impossible d'initialiser la base de données.\n{exc}")
        raise

    if not scheduler.running:
        scheduler.add_job(
            __job_retry_failed_notifications,
            "interval",
            minutes=5,
            id="retry_notifications",
            replace_existing=True,
        )
        scheduler.start()

    print("[API] Backend prêt : http://127.0.0.1:8000/docs")
    try:
        yield
    finally:
        if scheduler.running:
            scheduler.shutdown(wait=False)


app = FastAPI(
    title="Import Export Platform API",
    description="API complète de la plateforme mondiale import/export — 3LM Solutions",
    version="1.0.0",
    lifespan=lifespan,
)
app.include_router(webhooks.router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
os.makedirs("uploads/logos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(auth.router, prefix="/api")
app.include_router(listings.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(integrations.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")
app.include_router(matching.router, prefix="/api")
app.include_router(payments_alias.router, prefix="/api")
app.include_router(invoices_alias.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(reference_options.router, prefix="/api")
@app.get("/", tags=["Système"], summary="État de l'API")
def root():
    return {"message": "Import Export API", "docs": "/docs", "version": app.version}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = error.get("loc", [""])[-1]
        message = error.get("msg", "Erreur de validation")
        errors.append({"champ": field, "message": message})
    return JSONResponse(
        status_code=422,
        content={"detail": "Erreur de validation", "erreurs": errors},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


# Toute erreur non prévue (bug, appel externe qui échoue...) : jamais de traceback,
# ni dans le terminal ni dans un fichier — juste un message clair au client.
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Une erreur interne est survenue."},
    )
    
def __job_retry_failed_notifications():
    db = SessionLocal()
    try:
        retry_failed_notifications(db)
    finally:
        db.close()