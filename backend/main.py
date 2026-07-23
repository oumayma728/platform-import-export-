import os
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import connect_db, disconnect_db
from routers import auth, listings, accounts, favorites, matching, messaging, billing, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


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

uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(uploads_dir, "logos"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    from config import PORT
    uvicorn.run("main:app", host="0.0.0.0", port=PORT)
