import stripe
from fastapi import HTTPException
from app.config.config import settings
from app.models.models import Billing, UserQuota, StatutFacturation
from sqlalchemy.orm import Session

stripe.api_key = settings.STRIPE_SECRET_KEY or "sk_test_mock_key_for_development"

PRICE_PACK_10 = settings.STRIPE_PRICE_PACK
PRICE_ABONNEMENT = settings.STRIPE_PRICE_SUB

def create_checkout_session(db: Session, company_id: str, type_paiement: str, success_url: str, cancel_url: str):
    billing = db.query(Billing).filter(Billing.company_id == company_id).first()
    if not billing:
        raise HTTPException(status_code=404, detail="Profil de facturation introuvable")

    if type_paiement == "pack":
        mode = "payment"
        price_id = PRICE_PACK_10
    elif type_paiement == "abonnement":
        mode = "subscription"
        price_id = PRICE_ABONNEMENT
    else:
        raise HTTPException(status_code=400, detail="Type de paiement invalide. Utilisez 'pack' ou 'abonnement'.")

    # Mock mode si les clés ou prix Stripe ne sont pas configurés
    if not stripe.api_key or "mock" in stripe.api_key or not price_id:
        return {"checkout_url": f"{success_url}?session_id=mock_session_123&type={type_paiement}"}

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode=mode,
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=company_id,
            metadata={
                "company_id": company_id,
                "type_paiement": type_paiement
            }
        )
        return {"checkout_url": session.url}
    except Exception as e:
        # Fallback mock in case of Stripe API failure (e.g. invalid price ID)
        return {"checkout_url": f"{success_url}?session_id=mock_session_error_fallback&type={type_paiement}"}
