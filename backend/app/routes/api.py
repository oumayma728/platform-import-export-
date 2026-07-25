from fastapi import APIRouter
from app.routes import auth, listings, admin

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
