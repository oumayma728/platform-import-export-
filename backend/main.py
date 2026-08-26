import os
import asyncio
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import connect_db, disconnect_db
from routers import auth, listings, accounts, favorites, matching, messaging, billing, admin, internal, user_moderation, notifications

NIGHTLY_RECOMPUTE_HOURS = int(os.getenv("TRUST_RECOMPUTE_HOURS", "24"))


async def _nightly_trust_recompute_loop():
    """Filet de sécurité nocturne (spec §5.5) : recompute de tous les scores
    de confiance en cas de mise à jour événementielle manquée."""
    while True:
        try:
            await asyncio.sleep(NIGHTLY_RECOMPUTE_HOURS * 3600)
            from trust import recompute_all_trust_scores

            updated = await recompute_all_trust_scores()
            print(f"[trust] recompute nocturne : {updated} entreprises mises à jour", flush=True)
        except asyncio.CancelledError:
            break
        except Exception as exc:  # pragma: no cover
            print(f"[trust] recompute nocturne en échec : {exc}", flush=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    _ensure_storage()
    task = asyncio.create_task(_nightly_trust_recompute_loop())
    try:
        yield
    finally:
        task.cancel()
        await disconnect_db()


def _ensure_storage():
    """Prépare le stockage au démarrage (spec §3) : création du bucket MinIO
    (no-op en mode local), répertoires locaux d'upload."""
    from storage import ensure_bucket
    from config import MINIO_ENDPOINT

    if MINIO_ENDPOINT and not ensure_bucket():
        print("[storage] AVERTISSEMENT : échec de création/vérification du bucket MinIO "
              f"({MINIO_ENDPOINT}) — bascule en stockage local.", flush=True)


app = FastAPI(title="Platform Import/Export API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(accounts.router)
app.include_router(favorites.router)
app.include_router(matching.router)
app.include_router(messaging.router)
app.include_router(billing.router)
app.include_router(admin.router)
app.include_router(internal.router)
app.include_router(user_moderation.router)
app.include_router(notifications.router)

uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(uploads_dir, "logos"), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "kyb"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    from config import PORT
    uvicorn.run("main:app", host="0.0.0.0", port=PORT)
