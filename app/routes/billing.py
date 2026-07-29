import os
import stripe
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.middleware.auth import verify_token
from app.models.billing import BillingEvent, UserQuota
from app.models.user import User
from app.schemas.billing import PaymentIntentCreate, SubscriptionCreate

router = APIRouter(prefix="/billing", tags=["Facturation"])
SUBSCRIPTION_PRICE = float(os.getenv("SUBSCRIPTION_PRICE", "29"))
logger = logging.getLogger("import_export_api")

def quota_for(user_id: int, db: Session):
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if not quota:
        quota = UserQuota(user_id=user_id)
        db.add(quota)
        db.commit()
        db.refresh(quota)
    return quota

def _require_stripe():
    secret = os.getenv("STRIPE_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=503, detail="Stripe non configuré")
    stripe.api_key = secret
    return stripe

@router.get("/status", summary="Consulter son quota et sa recommandation")
def billing_status(user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    quota = quota_for(user["id"], db)
    return {
        "chats_utilises": quota.chats_utilises,
        "chats_gratuits": quota.chats_gratuits,
        "statut": quota.statut,
        "depense_usage": quota.depense_usage,
        "recommendation_abonnement": (quota.depense_usage or 0) > SUBSCRIPTION_PRICE,
    }

@router.post("/create-payment-intent", summary="Créer un paiement à l'usage")
def payment_intent(data: PaymentIntentCreate, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    stripe_module = _require_stripe()
    try:    
        intent = stripe_module.PaymentIntent.create(
            amount=data.amount,
            currency=data.currency,
            metadata={"user_id": str(user["id"]), "type": "usage"},
        )
        return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}
    except Exception as e:
        logger.error(f"Erreur Stripe: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création du paiement")

@router.post("/subscribe", summary="Créer un abonnement Stripe")
def subscribe(data: SubscriptionCreate, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    stripe_module = _require_stripe()
    db_user = db.get(User, user["id"])
    quota = quota_for(user["id"], db)
    
    customer_id = getattr(quota, "stripe_customer_id", None)
    if not customer_id:
        customer = stripe_module.Customer.create(
            email=db_user.email if db_user else None,
            metadata={"user_id": str(user["id"])},
        )
        customer_id = customer.id
        quota.stripe_customer_id = customer_id
        db.commit()

    # --- DÉBOGAGE : Afficher ce qui est envoyé ---
    # On s'assure que le price_id est une chaîne propre sans espaces
    actual_price_id = str(data.price_id).strip()
   

    try:
        session = stripe_module.checkout.Session.create(
            mode="subscription",
            customer=customer_id,
            line_items=[{
                "price": actual_price_id, 
                "quantity": 1
            }],
            # Conversion explicite des URLs Pydantic en chaînes de caractères
            success_url=str(data.success_url),
            cancel_url=str(data.cancel_url),
            metadata={"user_id": str(user["id"])},
            subscription_data={"metadata": {"user_id": str(user["id"])}},
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        logger.error(f"Erreur Stripe (subscribe) : {str(e)}")
        # Renvoi de l'erreur détaillée pour faciliter le diagnostic
        raise HTTPException(status_code=400, detail=f"Erreur Stripe : {str(e)}")
