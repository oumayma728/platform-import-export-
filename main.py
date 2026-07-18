from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes import auth, listings, conversations, billing, notifications
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(
    title="Import Export Platform API",
    description="API complète de la plateforme mondiale import/export — 3LM Solutions",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(listings.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")

@app.get("/", tags=["Système"], summary="État de l'API")
def root():
    return {"message": "Import Export API", "docs": "/docs", "version": app.version}

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = []
    for error in exc.errors():
        field = error.get("loc", [""])[-1]
        message = error.get("msg", "Erreur de validation")
        errors.append({"champ": field, "message": message})
    return JSONResponse(
        status_code=422,
        content={"detail": "Erreur de validation", "erreurs": errors}
    )