import os
import stripe
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import verify_token
from app.models.billing import UserQuota
from app.models.user import User
from app.schemas.billing import PaymentIntentCreate, SubscriptionCreate


router = APIRouter(prefix="/billing", tags=["Facturation"])
logger = logging.getLogger("import_export_api")

SUBSCRIPTION_PRICE = float(os.getenv("SUBSCRIPTION_PRICE", "29"))

# Stripe attend les montants dans la plus petite unité monétaire.
# 50 = 0,50 EUR ; 2900 = 29,00 EUR.
PLAN_PRICES_CENTS = {
    "pay-per-use": 50,
    "premium": 2900,
}


def quota_for(user_id: int, db: Session) -> UserQuota:
    quota = (
        db.query(UserQuota)
        .filter(UserQuota.user_id == user_id)
        .first()
    )

    if not quota:
        quota = UserQuota(
            user_id=user_id,
            messages_utilises=0,
            messages_gratuits=50,
            statut="GRATUIT",
            is_premium=False,
            depense_usage=0.0,
        )
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


def _stripe_customer_for(user_id: int, db: Session):
    stripe_module = _require_stripe()
    quota = quota_for(user_id, db)
    db_user = db.get(User, user_id)

    customer_id = quota.stripe_customer_id
    if customer_id:
        try:
            customer = stripe_module.Customer.retrieve(customer_id)
            if not getattr(customer, "deleted", False):
                return stripe_module, customer, quota
        except Exception as exc:
            logger.warning("Customer Stripe introuvable (%s): %s", customer_id, exc)

    customer = stripe_module.Customer.create(
        email=db_user.email if db_user else None,
        metadata={"user_id": str(user_id)},
    )
    quota.stripe_customer_id = customer.id
    db.commit()
    db.refresh(quota)
    return stripe_module, customer, quota


@router.get("/status", summary="Consulter son quota et sa recommandation")
def billing_status(
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    quota = quota_for(user["id"], db)

    used = int(quota.messages_utilises or 0)
    limit = int(quota.messages_gratuits or 50)
    remaining = max(0, limit - used)
    statut = str(quota.statut or "GRATUIT").upper()

    is_premium = bool(quota.is_premium) or statut in {"ABONNE", "PREMIUM"}
    is_pay_per_use = statut in {
        "PAIEMENT_USAGE",
        "PAY_PER_USE",
        "PAY-PER-USE",
        "USAGE",
    }

    return {
        # Noms corrects
        "messages_utilises": used,
        "messages_gratuits": limit,
        "messages_restants": None if is_premium or is_pay_per_use else remaining,
        "messages_used": used,
        "messages_limit": limit,
        "messages_remaining": None if is_premium or is_pay_per_use else remaining,

        "statut": statut,
        "is_premium": is_premium,
        "pay_per_use": is_pay_per_use,
        "price_per_conversation": 0.50 if is_pay_per_use else None,
        "depense_usage": float(quota.depense_usage or 0),
        "recommendation_abonnement": float(quota.depense_usage or 0) > SUBSCRIPTION_PRICE,
        "stripe_customer_id": quota.stripe_customer_id,
        "stripe_subscription_id": quota.stripe_subscription_id,

        # Compatibilité temporaire avec d'anciens écrans frontend.
        "chats_utilises": used,
        "chats_gratuits": limit,
    }


@router.post("/create-payment-intent", summary="Créer un paiement à l'usage")
def payment_intent(
    data: PaymentIntentCreate,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)

    if data.plan_id:
        amount = PLAN_PRICES_CENTS.get(data.plan_id)
        if amount is None:
            raise HTTPException(status_code=400, detail="Plan de paiement invalide")
    else:
        amount = data.amount

    if amount is None:
        raise HTTPException(status_code=400, detail="amount ou plan_id requis")

    try:
        intent = stripe_module.PaymentIntent.create(
            amount=int(amount),
            currency=(data.currency or "eur").lower(),
            customer=customer.id,
            automatic_payment_methods={"enabled": True},
            metadata={
                "user_id": str(user["id"]),
                "type": "usage",
                "plan_id": data.plan_id or "",
            },
        )
        return {
            "client_secret": intent.client_secret,
            "clientSecret": intent.client_secret,
            "payment_intent_id": intent.id,
            "paymentIntentId": intent.id,
        }
    except Exception as exc:
        logger.exception("Erreur Stripe PaymentIntent: %s", exc)
        raise HTTPException(status_code=400, detail="Impossible de créer le paiement")


@router.post("/subscribe", summary="Créer un abonnement Stripe")
def subscribe(
    data: SubscriptionCreate,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)

    actual_price_id = os.getenv("STRIPE_PREMIUM_PRICE_ID") or str(data.price_id).strip()
    if not actual_price_id:
        raise HTTPException(status_code=503, detail="Price ID Premium non configuré")

    try:
        session = stripe_module.checkout.Session.create(
            mode="subscription",
            customer=customer.id,
            line_items=[{"price": actual_price_id, "quantity": 1}],
            success_url=str(data.success_url),
            cancel_url=str(data.cancel_url),
            metadata={"user_id": str(user["id"]), "plan": "premium"},
            subscription_data={
                "metadata": {"user_id": str(user["id"]), "plan": "premium"}
            },
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as exc:
        logger.exception("Erreur Stripe subscribe: %s", exc)
        raise HTTPException(
            status_code=400,
            detail="Impossible de créer l'abonnement, veuillez réessayer.",
        )


@router.post("/setup-intent", summary="Préparer l'enregistrement sécurisé d'une carte")
def create_setup_intent(
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)
    try:
        intent = stripe_module.SetupIntent.create(
            customer=customer.id,
            payment_method_types=["card"],
            usage="off_session",
            metadata={"user_id": str(user["id"])},
        )
        return {"client_secret": intent.client_secret, "clientSecret": intent.client_secret}
    except Exception as exc:
        logger.exception("Erreur Stripe SetupIntent: %s", exc)
        raise HTTPException(
            status_code=400,
            detail="Impossible de préparer l'enregistrement de la carte",
        )


@router.get("/payment-methods", summary="Lister les moyens de paiement Stripe")
def list_payment_methods(
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)
    try:
        methods = stripe_module.PaymentMethod.list(customer=customer.id, type="card")
        invoice_settings = getattr(customer, "invoice_settings", None)
        default_id = invoice_settings.get("default_payment_method") if invoice_settings else None

        result = []
        for pm in methods.data:
            card = pm.card
            billing_details = getattr(pm, "billing_details", None)
            holder = billing_details.get("name") if billing_details else None
            result.append({
                "id": pm.id,
                "type": "card",
                "brand": str(card.brand).capitalize(),
                "last4": card.last4,
                "expiry": f"{int(card.exp_month):02d}/{str(card.exp_year)[-2:]}",
                "holder": holder or "",
                "isDefault": pm.id == default_id,
            })
        return result
    except Exception as exc:
        logger.exception("Erreur Stripe payment methods: %s", exc)
        raise HTTPException(status_code=400, detail="Impossible de charger les moyens de paiement")


@router.post("/payment-methods/{payment_method_id}/default", summary="Définir une carte par défaut")
def set_default_payment_method(
    payment_method_id: str,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)
    try:
        pm = stripe_module.PaymentMethod.retrieve(payment_method_id)
        if getattr(pm, "customer", None) != customer.id:
            raise HTTPException(status_code=404, detail="Moyen de paiement introuvable")
        stripe_module.Customer.modify(
            customer.id,
            invoice_settings={"default_payment_method": payment_method_id},
        )
        return {"success": True}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Erreur Stripe carte par défaut: %s", exc)
        raise HTTPException(status_code=400, detail="Impossible de modifier le moyen de paiement par défaut")


@router.delete("/payment-methods/{payment_method_id}", summary="Supprimer une carte Stripe")
def delete_payment_method(
    payment_method_id: str,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)
    try:
        pm = stripe_module.PaymentMethod.retrieve(payment_method_id)
        if getattr(pm, "customer", None) != customer.id:
            raise HTTPException(status_code=404, detail="Moyen de paiement introuvable")
        stripe_module.PaymentMethod.detach(payment_method_id)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Erreur Stripe suppression carte: %s", exc)
        raise HTTPException(status_code=400, detail="Impossible de supprimer le moyen de paiement")


@router.get("/invoices", summary="Lister les factures de l'utilisateur")
def get_invoices(
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)
    try:
        invoices = stripe_module.Invoice.list(customer=customer.id, limit=100)
        return [
            {
                "id": invoice.id,
                "number": invoice.number,
                "status": invoice.status,
                "currency": invoice.currency,
                "amount_due": invoice.amount_due,
                "amount_paid": invoice.amount_paid,
                "created": invoice.created,
                "hosted_invoice_url": invoice.hosted_invoice_url,
                "invoice_pdf": invoice.invoice_pdf,
            }
            for invoice in invoices.data
        ]
    except Exception as exc:
        logger.exception("Erreur Stripe factures: %s", exc)
        raise HTTPException(status_code=400, detail="Impossible de charger les factures")


@router.get("/invoices/{invoice_id}", summary="Détail d'une facture")
def get_invoice(
    invoice_id: str,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)
    try:
        invoice = stripe_module.Invoice.retrieve(invoice_id)
        if getattr(invoice, "customer", None) != customer.id:
            raise HTTPException(status_code=404, detail="Facture introuvable")
        return {
            "id": invoice.id,
            "number": invoice.number,
            "status": invoice.status,
            "currency": invoice.currency,
            "amount_due": invoice.amount_due,
            "amount_paid": invoice.amount_paid,
            "created": invoice.created,
            "hosted_invoice_url": invoice.hosted_invoice_url,
            "invoice_pdf": invoice.invoice_pdf,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Erreur Stripe facture: %s", exc)
        raise HTTPException(status_code=404, detail="Facture introuvable")
