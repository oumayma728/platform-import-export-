import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.middleware.auth import verify_token
from app.models.billing import BillingEvent, UserQuota
from app.schemas.billing import PaymentIntentCreate, SubscriptionCreate

router = APIRouter(prefix="/billing", tags=["Facturation"])
SUBSCRIPTION_PRICE = float(os.getenv("SUBSCRIPTION_PRICE", "29"))

def quota_for(user_id: int, db: Session):
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if not quota:
        quota = UserQuota(user_id=user_id)
        db.add(quota)
        db.commit()
        db.refresh(quota)
    return quota

@router.get("/status", summary="Consulter son quota et sa recommandation", description="Afficher l'état du quota de chat utilisateur et la recommandation d'abonnement.", responses={200: {"description": "Quota retourné"}, 401: {"description": "Non authentifié"}})
def billing_status(user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    quota = quota_for(user["id"], db)
    return {
        "chats_utilises": quota.chats_utilises,
        "chats_gratuits": quota.chats_gratuits,
        "statut": quota.statut,
        "depense_usage": quota.depense_usage,
        "recommendation_abonnement": quota.depense_usage > SUBSCRIPTION_PRICE,
    }

@router.post("/create-payment-intent", summary="Créer un paiement à l'usage", description="Créer un intent de paiement Stripe pour un usage ponctuel.", responses={200: {"description": "Intent de paiement créé"}, 401: {"description": "Non authentifié"}, 503: {"description": "Stripe non configuré"}})
def payment_intent(data: PaymentIntentCreate, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    if not os.getenv("STRIPE_SECRET_KEY"):
        raise HTTPException(status_code=503, detail="Stripe n'est pas configuré")
    import stripe
    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    intent = stripe.PaymentIntent.create(amount=data.amount, currency=data.currency, metadata={"user_id": user["id"]})
    return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}

@router.post("/subscribe", summary="Créer un abonnement Stripe", description="Initialiser un abonnement Stripe à partir d'un price_id.", responses={200: {"description": "Abonnement initialisé"}, 401: {"description": "Non authentifié"}, 503: {"description": "Stripe non configuré"}})
def subscribe(data: SubscriptionCreate, user: dict = Depends(verify_token)):
    if not os.getenv("STRIPE_SECRET_KEY"):
        raise HTTPException(status_code=503, detail="Stripe n'est pas configuré")
    return {"message": "Créer le Checkout Session avec le price_id fourni côté Stripe", "price_id": data.price_id, "user_id": user["id"]}

@router.post("/webhook", include_in_schema=False)
async def webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    event_type = payload.get("type", "unknown")
    event_id = payload.get("id")
    if event_id and db.query(BillingEvent).filter(BillingEvent.stripe_event_id == event_id).first():
        return {"received": True}
    obj = payload.get("data", {}).get("object", {})
    metadata = obj.get("metadata", {})
    user_id = metadata.get("user_id")
    db.add(BillingEvent(stripe_event_id=event_id, event_type=event_type, user_id=int(user_id) if user_id else None))
    if user_id:
        quota = quota_for(int(user_id), db)
        if event_type in ("payment_intent.succeeded", "customer.subscription.updated"):
            quota.statut = "PAIEMENT_USAGE" if event_type.startswith("payment") else "ABONNE"
        elif event_type == "customer.subscription.deleted":
            quota.statut = "ABONNEMENT_EXPIRE"
    db.commit()
    return {"received": True}
