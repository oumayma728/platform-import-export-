from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes import auth, listings, conversations, billing, notifications, webhooks, integrations
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

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
app.include_router(webhooks.router, prefix="/api")
app.include_router(integrations.router, prefix="/api")


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