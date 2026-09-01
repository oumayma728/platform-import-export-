"""
billing.py — Gestion de la facturation et des quotas (Stripe)
"""
import logging
import os
from datetime import datetime

import stripe
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserQuota, Billing
from ..routes.auth import get_current_user
from ..schemas import UserRead
from ..services.email import payment_confirmed_email_html
from ..services.notification import NotificationService

logger = logging.getLogger(__name__)

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


@router.post("/create-payment-intent", response_model=dict)
def create_payment_intent(
    amount: float = 9.90,  # 9.90€ par défaut pour un pack
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Crée une session de paiement unique (Pack de chats additionnels).
    Logique de recommandation : Si l'utilisateur a déjà dépensé plus que l'abonnement mensuel (29€), 
    on lui recommande de passer à l'abonnement.
    """
    _require_stripe()

    billing = db.query(Billing).filter(Billing.user_id == current_user.id).first()
    if not billing:
        raise HTTPException(status_code=404, detail="Billing introuvable")

    # Recommandation logic
    abonnement_price = 29.0
    recommendation = None
    if billing.total_spent >= abonnement_price:
        recommendation = "Vous avez dépensé plus que le coût d'un abonnement mensuel. Nous vous recommandons de souscrire à l'abonnement illimité."

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": "Pack Paiement à l'Usage",
                        "description": "Crédits de chat supplémentaires",
                    },
                    "unit_amount": int(amount * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{FRONTEND_URL}/payment/chat-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/payment/cancel",
            metadata={
                "user_id": current_user.id,
                "type": "paiement_usage",
                "amount": str(amount),
            },
        )

        return {
            "session_id": session.id,
            "checkout_url": session.url,
            "recommendation": recommendation,
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Erreur Stripe : {str(e)}")


@router.post("/subscribe", response_model=dict)
def subscribe(
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Souscrit à un abonnement mensuel récurrent pour les chats illimités.
    """
    _require_stripe()

    user = db.query(User).filter(User.id == current_user.id).first()
    billing = db.query(Billing).filter(Billing.user_id == current_user.id).first()
    quota = db.query(UserQuota).filter(UserQuota.user_id == current_user.id).first()
    
    if quota.status == "ABONNE":
        return {"message": "Vous êtes déjà abonné", "active": True}

    try:
        if not billing.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.full_name or user.email,
                metadata={"user_id": user.id},
            )
            billing.stripe_customer_id = customer.id
            db.commit()

        session = stripe.checkout.Session.create(
            customer=billing.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": "Abonnement Chats Illimités",
                        "description": "Messages illimités sur la plateforme",
                    },
                    "unit_amount": 2900,  # 29€/mois
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            }],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/payment/chat-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/payment/cancel",
            metadata={
                "user_id": user.id,
                "type": "abonnement",
            },
        )

        return {
            "session_id": session.id,
            "checkout_url": session.url,
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Erreur Stripe : {str(e)}")


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook Stripe pour la facturation (Billing et UserQuota).
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET == "whsec_CHANGEME":
        # Mode développement / test (simulation)
        try:
            import json as _json
            data_dict = _json.loads(payload) if payload else {}
            event = stripe.Event.construct_from(data_dict, stripe.api_key)
        except Exception:
            event = stripe.Event.construct_from(
                {"type": "checkout.session.completed", "data": {"object": {}}},
                stripe.api_key,
            )
    else:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            raise HTTPException(status_code=400, detail=f"Webhook invalide : {str(e)}")

    # 1. Gérer le paiement réussi (paiement à l'usage ou initialisation abonnement)
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        payment_type = metadata.get("type")
        user_id = metadata.get("user_id")
        
        if user_id:
            quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
            billing = db.query(Billing).filter(Billing.user_id == user_id).first()
            
            if quota and billing:
                if payment_type == "paiement_usage":
                    quota.status = "PAIEMENT_USAGE"
                    # Ajoute au montant total dépensé
                    amount = float(metadata.get("amount", 9.90))
                    billing.total_spent += amount
                
                if session.get("subscription"):
                    billing.stripe_subscription_id = session["subscription"]
                    quota.status = "ABONNE"
                
                db.commit()

                # Notification de confirmation de paiement (via NotificationService + NotificationLog)
                try:
                    amount = float(metadata.get("amount", 9.90))
                    user = db.query(User).filter(User.id == user_id).first()
                    if user:
                        company_name = user.full_name or "Votre compte"
                        NotificationService.send_email(
                            to=user.email,
                            subject="💳 Paiement confirmé",
                            body=payment_confirmed_email_html(company_name, amount),
                            user_id=user.id,
                            db=db,
                        )
                except Exception as n_err:
                    logger.error(f"Erreur notification paiement confirmé pour {user_id}: {n_err}")

    # 2. Gérer les mises à jour d'abonnement
    elif event["type"] in ("customer.subscription.updated", "customer.subscription.created"):
        subscription = event["data"]["object"]
        billing = db.query(Billing).filter(Billing.stripe_subscription_id == subscription["id"]).first()
        if billing:
            quota = db.query(UserQuota).filter(UserQuota.user_id == billing.user_id).first()
            if quota:
                if subscription["status"] == "active":
                    quota.status = "ABONNE"
                else:
                    quota.status = "ABONNEMENT_EXPIRE"
                db.commit()

    # 3. Gérer l'annulation/suppression d'abonnement
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        billing = db.query(Billing).filter(Billing.stripe_subscription_id == subscription["id"]).first()
        if billing:
            quota = db.query(UserQuota).filter(UserQuota.user_id == billing.user_id).first()
            if quota:
                quota.status = "ABONNEMENT_EXPIRE"
                billing.stripe_subscription_id = None
                db.commit()

    return {"received": True, "type": event["type"]}
