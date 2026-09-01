"""
payments.py — Intégration Stripe pour les paiements de stands et abonnements chats
"""
import os
from datetime import datetime
from typing import Optional

import stripe
from fastapi import APIRouter, HTTPException, Request, Depends, Header
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Stand, User
from ..routes.auth import get_current_user, require_role
from ..schemas import UserRead

router = APIRouter()

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

if STRIPE_SECRET_KEY and STRIPE_SECRET_KEY != "sk_test_CHANGEME":
    stripe.api_key = STRIPE_SECRET_KEY


def _require_stripe():
    """Vérifie que Stripe est configuré."""
    if not STRIPE_SECRET_KEY or STRIPE_SECRET_KEY == "sk_test_CHANGEME":
        raise HTTPException(
            status_code=503,
            detail="Stripe non configuré. Ajoutez STRIPE_SECRET_KEY dans le fichier .env",
        )


# ─────────────────────────────────────────────────────────────────────────────
# PAIEMENT STAND
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/stands/{stand_id}/checkout", response_model=dict)
def create_stand_checkout(
    stand_id: str,
    current_user: UserRead = Depends(require_role("admin", "exporter")),
    db: Session = Depends(get_db),
):
    """
    Crée une session de paiement Stripe Checkout pour réserver un stand.
    Retourne l'URL de redirection Stripe.
    """
    stand = db.query(Stand).filter(Stand.id == stand_id).first()
    if not stand:
        raise HTTPException(status_code=404, detail="Stand introuvable")

    if stand.payment_status == "PAID":
        raise HTTPException(status_code=400, detail="Ce stand a déjà été payé")

    from ..models import Salon
    salon = db.query(Salon).filter(Salon.id == stand.salon_id).first()
    stand_price = salon.stand_price if salon and salon.stand_price else 1200.0

    if not STRIPE_SECRET_KEY or STRIPE_SECRET_KEY == "sk_test_CHANGEME":
        mock_id = f"cs_test_mock_{stand_id[:8]}"
        stand.stripe_session_id = mock_id
        stand.payment_status = "PAID"
        stand.status = "EN_ATTENTE_VALIDATION"
        stand.updated_at = datetime.utcnow()
        db.commit()
        return {
            "session_id": mock_id,
            "checkout_url": f"{FRONTEND_URL}/payment/success?stand_id={stand_id}&session_id={mock_id}",
            "amount": stand_price,
            "currency": "EUR",
        }

    stand = db.query(Stand).filter(Stand.id == stand_id).first()
    if not stand:
        raise HTTPException(status_code=404, detail="Stand introuvable")

    if stand.payment_status == "PAID":
        raise HTTPException(status_code=400, detail="Ce stand a déjà été payé")

    # Récupérer le prix du salon
    from ..models import Salon
    salon = db.query(Salon).filter(Salon.id == stand.salon_id).first()
    stand_price = salon.stand_price if salon and salon.stand_price else 1200.0

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Stand — {stand.company_name}",
                        "description": f"Réservation de stand pour le salon virtuel",
                    },
                    "unit_amount": int(stand_price * 100),  # en centimes
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{FRONTEND_URL}/payment/success?stand_id={stand_id}&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/payment/cancel?stand_id={stand_id}",
            metadata={
                "stand_id": stand_id,
                "salon_id": stand.salon_id,
                "exporter_id": stand.exporter_id,
                "type": "stand_payment",
            },
        )

        # Enregistrer la session Stripe
        stand.stripe_session_id = session.id
        stand.updated_at = datetime.utcnow()
        db.commit()

        return {
            "session_id": session.id,
            "checkout_url": session.url,
            "amount": stand_price,
            "currency": "EUR",
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Erreur Stripe : {str(e)}")


@router.get("/stands/{stand_id}/status", response_model=dict)
def get_stand_payment_status(
    stand_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retourne le statut de paiement d'un stand."""
    stand = db.query(Stand).filter(Stand.id == stand_id).first()
    if not stand:
        raise HTTPException(status_code=404, detail="Stand introuvable")

    return {
        "stand_id": stand_id,
        "payment_status": stand.payment_status,
        "stripe_session_id": stand.stripe_session_id,
    }


# ─────────────────────────────────────────────────────────────────────────────
# WEBHOOK STRIPE
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook Stripe — traite les événements de paiement confirmé.
    Configure l'URL dans le dashboard Stripe : https://your-domain/payments/webhooks/stripe
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    import json
    try:
        body_json = json.loads(payload.decode("utf-8")) if payload else {}
    except Exception:
        body_json = {}

    if not STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET == "whsec_CHANGEME":
        event = body_json if body_json else {"type": "checkout.session.completed", "data": {"object": {}}}
    else:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            raise HTTPException(status_code=400, detail=f"Webhook invalide : {str(e)}")

    # Traiter les événements
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        payment_type = metadata.get("type")

        if payment_type == "stand_payment":
            stand_id = metadata.get("stand_id")
            if stand_id:
                stand = db.query(Stand).filter(Stand.id == stand_id).first()
                if stand:
                    stand.payment_status = "PAID"
                    stand.status = "EN_ATTENTE_VALIDATION"
                    stand.stripe_session_id = session.get("id")
                    stand.updated_at = datetime.utcnow()
                    db.commit()

    elif event["type"] in ("checkout.session.expired", "payment_intent.payment_failed"):
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        if metadata.get("type") == "stand_payment":
            stand_id = metadata.get("stand_id")
            if stand_id:
                stand = db.query(Stand).filter(Stand.id == stand_id).first()
                if stand:
                    stand.payment_status = "FAILED"
                    stand.updated_at = datetime.utcnow()
                    db.commit()

    return {"received": True, "type": event["type"]}
