from fastapi import APIRouter
from app.routes import auth, listings, currency, billing, admin, messaging, webhooks, logistics, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentification"])
api_router.include_router(listings.router, prefix="/listings", tags=["annonces"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(messaging.router, tags=["messaging"])
api_router.include_router(currency.router, prefix="/currency", tags=["devises"])
api_router.include_router(billing.router, prefix="/billing", tags=["facturation"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["logistics"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
