import os
import stripe
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import verify_token
from app.models.billing import UserQuota
from app.models.user import User
from app.schemas.billing import (
    PaymentIntentCreate,
    SubscriptionCreate,
    PaymentConfirm,
)


router = APIRouter(prefix="/billing", tags=["Facturation"])
logger = logging.getLogger("import_export_api")

SUBSCRIPTION_PRICE = float(os.getenv("SUBSCRIPTION_PRICE", "29"))

# Stripe attend les montants dans la plus petite unité monétaire.
# 50 = 0,50 EUR ; 2900 = 29,00 EUR.
PLAN_PRICES_CENTS = {
    "pay-per-use": 50,
    "premium": 2900,
}
PRICE_PER_MESSAGE = 0.50
CURRENCY_SYMBOLS = {"usd": "$", "eur": "€", "gbp": "£", "tnd": "DT"}


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
    usage_cost_estimate = used * PRICE_PER_MESSAGE
    
    
    is_premium = bool(quota.is_premium) or statut in {"ABONNE", "PREMIUM"}
    is_pay_per_use = statut in {
        "PAIEMENT_USAGE",
        "PAY_PER_USE",
        "PAY-PER-USE",
        "USAGE",
    }

    # Résiliation programmée / date de renouvellement — uniquement pertinent
    # pour un vrai abonnement Stripe récurrent (Premium). Le paiement à
    # l'usage n'a pas de "période" à proprement parler.
    cancel_at_period_end = False
    renewal_date = None
    if quota.stripe_subscription_id:
        secret = os.getenv("STRIPE_SECRET_KEY")
        if secret:
            try:
                stripe.api_key = secret
                sub = stripe.Subscription.retrieve(quota.stripe_subscription_id)
                cancel_at_period_end = bool(sub.cancel_at_period_end)
                renewal_date = sub.current_period_end
            except Exception as exc:
                logger.warning("Impossible de récupérer l'abonnement Stripe: %s", exc)

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
        "price_per_conversation": PRICE_PER_MESSAGE if is_pay_per_use else None,
        "usage_cost_estimate": usage_cost_estimate,
        "cout_usage_estime": usage_cost_estimate,
        "depense_usage": float(quota.depense_usage or 0),
        "recommendation_abonnement": (
            not is_premium and usage_cost_estimate > SUBSCRIPTION_PRICE
),
        "stripe_customer_id": quota.stripe_customer_id,
        "stripe_subscription_id": quota.stripe_subscription_id,
        "cancel_at_period_end": cancel_at_period_end,
        "renewal_date": renewal_date,

        # Compatibilité temporaire avec d'anciens écrans frontend.
        "chats_utilises": used,
        "chats_gratuits": limit,
    }


#@router.post("/create-payment-intent", summary="Créer un paiement à l'usage")
#@router.post("/create-payment-intent", summary="Créer un paiement à l'usage")
@router.post("/create-payment-intent", summary="Créer un paiement à l'usage")
def payment_intent(
    data: PaymentIntentCreate,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    # Premium ne doit JAMAIS passer par PaymentIntent.
    # Premium utilise /billing/subscribe + Stripe Checkout.
    if data.plan_id == "premium":
        raise HTTPException(
            status_code=400,
            detail="Le plan Premium doit être payé via Stripe Checkout.",
        )

    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)

    if data.plan_id:
        amount = PLAN_PRICES_CENTS.get(data.plan_id)

        if amount is None:
            raise HTTPException(
                status_code=400,
                detail="Plan de paiement invalide",
            )
    else:
        amount = data.amount

    if amount is None:
        raise HTTPException(
            status_code=400,
            detail="amount ou plan_id requis",
        )

    try:
        intent = stripe_module.PaymentIntent.create(
            amount=int(amount),
            currency=(data.currency or "eur").lower(),
            customer=customer.id,
            automatic_payment_methods={"enabled": True},
            metadata={
                "user_id": str(user["id"]),
                "type": "usage",
                "plan_id": "pay-per-use",
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
        raise HTTPException(
            status_code=400,
            detail="Impossible de créer le paiement",
        )
@router.post("/subscribe", summary="Créer un abonnement Stripe")
def subscribe(
    data: SubscriptionCreate,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)

    actual_price_id = data.price_id or os.getenv("STRIPE_PREMIUM_PRICE_ID")
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


@router.post("/cancel-subscription", summary="Résilier Premium ou désactiver le paiement à l'usage")
def cancel_subscription(
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    quota = quota_for(user["id"], db)
    statut = str(quota.statut or "GRATUIT").upper()

    # Cas 1 : abonnement Premium — un vrai abonnement Stripe récurrent existe,
    # on programme la résiliation en fin de période déjà payée.
    if statut in {"ABONNE", "PREMIUM"} and quota.stripe_subscription_id:
        secret = os.getenv("STRIPE_SECRET_KEY")
        if not secret:
            raise HTTPException(status_code=503, detail="Stripe n'est pas configuré")
        stripe.api_key = secret
        try:
            subscription = stripe.Subscription.modify(
                quota.stripe_subscription_id,
                cancel_at_period_end=True,
            )
            return {
                "cancel_at_period_end": subscription.cancel_at_period_end,
                "renewal_date": subscription.current_period_end,
            }
        except Exception as exc:
            logger.exception("Erreur Stripe résiliation: %s", exc)
            raise HTTPException(status_code=400, detail="Impossible de résilier l'abonnement")

    # Cas 2 : paiement à l'usage — il n'y a AUCUN abonnement Stripe à annuler
    # (chaque paiement est un PaymentIntent isolé). "Résilier" ici veut juste
    # dire : arrêter d'utiliser ce mode, effet immédiat, pas de Stripe impliqué.
    if statut in {"PAIEMENT_USAGE", "PAY_PER_USE", "PAY-PER-USE", "USAGE"}:
        quota.statut = "GRATUIT"
        db.commit()
        return {"cancel_at_period_end": False, "renewal_date": None, "immediate": True}

    raise HTTPException(status_code=400, detail="Aucun abonnement actif à résilier")


@router.post("/reactivate-subscription", summary="Annuler la résiliation Premium programmée")
def reactivate_subscription(
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    quota = quota_for(user["id"], db)
    if not quota.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="Aucun abonnement Premium à réactiver")

    secret = os.getenv("STRIPE_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=503, detail="Stripe n'est pas configuré")
    stripe.api_key = secret
    try:
        subscription = stripe.Subscription.modify(
            quota.stripe_subscription_id,
            cancel_at_period_end=False,
        )
        return {
            "cancel_at_period_end": subscription.cancel_at_period_end,
            "renewal_date": subscription.current_period_end,
        }
    except Exception as exc:
        logger.exception("Erreur Stripe réactivation: %s", exc)
        raise HTTPException(status_code=400, detail="Impossible d'annuler la résiliation")


@router.post("/confirm-payment", summary="Confirmer et appliquer un paiement immédiatement (sans dépendre du webhook)")
def confirm_payment(
    data: PaymentConfirm,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, quota = _stripe_customer_for(user["id"], db)

    try:
        pi = stripe_module.PaymentIntent.retrieve(data.payment_intent_id)
    except Exception as exc:
        logger.exception("Erreur récupération PaymentIntent: %s", exc)
        raise HTTPException(status_code=400, detail="Paiement introuvable")

    # Sécurité : on vérifie que ce paiement appartient bien à l'utilisateur
    # connecté, et qu'il a réellement réussi côté Stripe — on ne fait
    # jamais confiance à ce que le frontend prétend.
    if getattr(pi, "customer", None) != customer.id:
        raise HTTPException(status_code=403, detail="Ce paiement n'appartient pas à cet utilisateur")

    if getattr(pi, "status", None) != "succeeded":
        raise HTTPException(status_code=400, detail="Ce paiement n'a pas encore réussi")

    metadata = getattr(pi, "metadata", None) or {}
    plan_id = metadata.get("plan_id") if hasattr(metadata, "get") else None
    amount = getattr(pi, "amount", 0) or 0

    if plan_id == "premium":
        raise HTTPException(
            status_code=400,
            detail="Un paiement Premium doit être traité via Stripe Checkout.",
    )

        quota.depense_usage = (quota.depense_usage or 0) + (amount / 100)
        quota.statut = "PAIEMENT_USAGE"
        quota.is_premium = False
    else:
        # Paiement à l'usage (ou plan_id absent/inconnu) : on comptabilise
        # la dépense et on passe en mode paiement à l'usage.
        quota.depense_usage = (quota.depense_usage or 0) + (amount / 100)
        quota.statut = "PAIEMENT_USAGE"
        quota.is_premium = False

    db.commit()
    db.refresh(quota)

    return {
        "statut": quota.statut,
        "is_premium": quota.is_premium,
        "pay_per_use": quota.statut == "PAIEMENT_USAGE",
    }


@router.get("/payment-methods", summary="Lister les moyens de paiement Stripe")
def list_payment_methods(
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)
    try:
        methods = stripe_module.PaymentMethod.list(customer=customer.id, type="card")
        invoice_settings = getattr(customer, "invoice_settings", None)
        default_id = None
        if invoice_settings:
            default_id = getattr(invoice_settings, "default_payment_method", None)

        result = []
        for pm in methods.data:
            card = pm.card
            billing_details = getattr(pm, "billing_details", None)
            holder = (
                getattr(billing_details, "name", None)
                if billing_details
                else None
            )
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


def _g(obj, name, default=None):
    """Accès défensif à un champ Stripe : ne plante jamais si le champ
    a été renommé/déplacé par une nouvelle version de l'API Stripe."""
    return getattr(obj, name, default)


def _format_amount(amount_cents, currency) -> str:
    symbol = CURRENCY_SYMBOLS.get((currency or "eur").lower(), (currency or "").upper() + " ")
    return f"{(amount_cents or 0) / 100:.2f} {symbol}"


def _format_ts(ts) -> str:
    if not ts:
        return ""
    try:
        return datetime.fromtimestamp(int(ts), tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return ""


def _map_invoice_status(status: str) -> str:
    return {"paid": "paid", "open": "pending", "draft": "pending",
            "uncollectible": "failed", "void": "failed"}.get(status, "pending")


def _from_invoice(invoice) -> dict:
    created = _g(invoice, "created", 0)
    amount_paid = _g(invoice, "amount_paid", 0)
    amount_due = _g(invoice, "amount_due", 0)
    currency = _g(invoice, "currency", "eur")
    invoice_id = _g(invoice, "id")
    number = _g(invoice, "number")
    # Stripe génère un vrai numéro de facture lisible pour les abonnements
    # (ex: "8A2F3C1-0001") — on l'utilise tel quel s'il existe.
    reference = number or f"FAC-{(invoice_id or '').replace('in_', '')[-8:].upper()}"
    return {
        "id": invoice_id,
        "number": number,
        "reference": reference,
        "date": _format_ts(created),
        "created": created or 0,
        "status": _map_invoice_status(_g(invoice, "status", "")),
        "currency": currency,
        "amount_due": amount_due,
        "amount_paid": amount_paid,
        "amount": _format_amount(amount_paid or amount_due, currency),
        "method": "Carte",
        "planTitle": "Premium",
        "description": "Abonnement Premium ",
        "hosted_invoice_url": _g(invoice, "hosted_invoice_url"),
        "invoice_pdf": _g(invoice, "invoice_pdf"),
    }


def _map_pi_status(status: str) -> str:
    if status == "succeeded":
        return "paid"
    if status in ("canceled",):
        return "failed"
    return "pending"


def _from_payment_intent(pi) -> dict:
    metadata = _g(pi, "metadata") or {}
    is_usage = _g(metadata, "type") == "usage" if hasattr(metadata, "get") or isinstance(metadata, dict) else False
    created = _g(pi, "created", 0)
    amount = _g(pi, "amount", 0)
    currency = _g(pi, "currency", "eur")
    status = _g(pi, "status", "")
    pi_id = _g(pi, "id")
    # Référence lisible pour l'utilisateur — l'ID technique Stripe complet
    # (pi_3UAAg4RxfMGs4QCl0fgo9K0c) n'a pas sa place dans une UI grand public.
    reference = f"PAY-{(pi_id or '').replace('pi_', '')[-8:].upper()}"
    return {
        "id": pi_id,
        "number": None,
        "reference": reference,
        "date": _format_ts(created),
        "created": created or 0,
        "status": _map_pi_status(status),
        "currency": currency,
        "amount_due": amount,
        "amount_paid": amount if status == "succeeded" else 0,
        "amount": _format_amount(amount, currency),
        "method": "Carte",
        "planTitle": "Paiement à l'usage" if is_usage else "Paiement",
        "description": "Paiement à l'usage" if is_usage else "Paiement ponctuel",
        "hosted_invoice_url": None,
        "invoice_pdf": None,
    }


@router.get("/invoices", summary="Lister les factures et paiements de l'utilisateur")
def get_invoices(
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)
    try:
        invoices = stripe_module.Invoice.list(customer=customer.id, limit=100)
    except Exception as exc:
        logger.exception("Erreur Stripe factures (Invoice.list): %s", exc)
        raise HTTPException(status_code=400, detail="Impossible de charger les factures")

    try:
        payment_intents = stripe_module.PaymentIntent.list(customer=customer.id, limit=100)
    except Exception as exc:
        logger.exception("Erreur Stripe factures (PaymentIntent.list): %s", exc)
        payment_intents = None

    results = []
    for inv in invoices.data:
        try:
            results.append(_from_invoice(inv))
        except Exception as exc:
            logger.exception("Erreur formatage facture %s: %s", _g(inv, "id"), exc)

    if payment_intents is not None:
        invoiced_pi_ids = set()
        for inv in invoices.data:
            pi_ref = _g(inv, "payment_intent")
            if pi_ref:
                invoiced_pi_ids.add(pi_ref if isinstance(pi_ref, str) else _g(pi_ref, "id"))

        for pi in payment_intents.data:
            try:
                if _g(pi, "id") in invoiced_pi_ids:
                    continue
                if _g(pi, "status") not in ("succeeded", "canceled", "requires_payment_method"):
                    continue
                results.append(_from_payment_intent(pi))
            except Exception as exc:
                logger.exception("Erreur formatage paiement %s: %s", _g(pi, "id"), exc)

    results.sort(key=lambda r: r.get("created") or 0, reverse=True)
    return results


@router.get("/invoices/{invoice_id}", summary="Détail d'une facture ou d'un paiement")
def get_invoice(
    invoice_id: str,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)
    try:
        # Les factures Stripe commencent par "in_", les PaymentIntents par "pi_".
        if invoice_id.startswith("pi_"):
            pi = stripe_module.PaymentIntent.retrieve(invoice_id)
            if _g(pi, "customer") != customer.id:
                raise HTTPException(status_code=404, detail="Paiement introuvable")
            return _from_payment_intent(pi)

        invoice = stripe_module.Invoice.retrieve(invoice_id)
        if _g(invoice, "customer") != customer.id:
            raise HTTPException(status_code=404, detail="Facture introuvable")
        return _from_invoice(invoice)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Erreur Stripe facture: %s", exc)
        raise HTTPException(status_code=404, detail="Facture introuvable")


@router.get("/invoices/{invoice_id}/pdf", summary="Obtenir l'URL du PDF d'une facture")
def get_invoice_pdf(
    invoice_id: str,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    stripe_module, customer, _quota = _stripe_customer_for(user["id"], db)
    try:
        if invoice_id.startswith("pi_"):
            pi = stripe_module.PaymentIntent.retrieve(invoice_id, expand=["latest_charge"])
            if _g(pi, "customer") != customer.id:
                raise HTTPException(status_code=404, detail="Paiement introuvable")

            latest_charge = _g(pi, "latest_charge")
            receipt_url = _g(latest_charge, "receipt_url") if latest_charge else None
            if not receipt_url:
                raise HTTPException(status_code=404, detail="PDF indisponible pour ce paiement")

            return {"url": receipt_url}

        invoice = stripe_module.Invoice.retrieve(invoice_id)
        if _g(invoice, "customer") != customer.id:
            raise HTTPException(status_code=404, detail="Facture introuvable")

        pdf_url = _g(invoice, "invoice_pdf") or _g(invoice, "hosted_invoice_url")
        if not pdf_url:
            raise HTTPException(status_code=404, detail="PDF indisponible pour cette facture")

        return {"url": pdf_url}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Erreur récupération PDF facture: %s", exc)
        raise HTTPException(status_code=404, detail="PDF indisponible pour cette facture")