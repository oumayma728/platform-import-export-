import os
import logging
import stripe
from fastapi import APIRouter, Depends, Request, HTTPException, Header
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.billing import BillingEvent, UserQuota
from app.models.user import User
from app.services.notification_service import create_notification

router = APIRouter(tags=["Webhooks"])
logger = logging.getLogger("import_export_api")


def _quota_for(user_id: int, db: Session) -> UserQuota:
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if not quota:
        quota = UserQuota(user_id=user_id)
        db.add(quota)
        db.commit()
        db.refresh(quota)
    return quota


@router.post(
    "/webhooks/stripe",
    include_in_schema=False,
    summary="Webhook Stripe",
    description=(
        "Reçoit les événements Stripe : payment_intent.succeeded, "
        "customer.subscription.updated, customer.subscription.deleted."
    ),
)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    secret_key = os.getenv("STRIPE_SECRET_KEY")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not secret_key or not webhook_secret:
        logger.error("Stripe n'est pas configuré dans les variables d'environnement")
        raise HTTPException(status_code=503, detail="Stripe n'est pas configuré")

    stripe.api_key = secret_key
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        logger.error(f"Signature webhook invalide : {str(e)}")
        raise HTTPException(status_code=400, detail="Signature webhook invalide")

    event_id = event["id"]
    event_type = event["type"]
    logger.info(f"Événement Stripe reçu : {event_type} ({event_id})")

    if db.query(BillingEvent).filter(BillingEvent.stripe_event_id == event_id).first():
        logger.info(f"Événement {event_id} déjà traité")
        return {"received": True}

    # StripeObject n'a pas de méthode .get() comme un vrai dict -> conversion obligatoire
    obj = event["data"]["object"].to_dict()
    user_id = _resolve_user_id(obj, db)
    logger.info(f"User ID résolu pour l'événement : {user_id}")

    db.add(BillingEvent(stripe_event_id=event_id, event_type=event_type, user_id=user_id))

    if user_id:
        quota = _quota_for(user_id, db)
        emetteur = db.get(User, user_id)

        if event_type == "payment_intent.succeeded":
            montant = obj.get("amount", 0) / 100
            quota.depense_usage = (quota.depense_usage or 0) + montant
            quota.statut = "PAIEMENT_USAGE"
            logger.info(f"Quota mis à jour pour {user_id} : PAIEMENT_USAGE (+{montant})")
            if emetteur:
                create_notification(
                    db, user_id, "EMAIL", emetteur.email,
                    f"Votre paiement de {montant:.2f} a été confirmé.",
                    sujet="Paiement confirmé",
                )

        elif event_type in ("customer.subscription.updated", "checkout.session.completed", "customer.subscription.created"):
            quota.statut = "ABONNE"
            # "subscription" en premier : c'est le seul champ correct pour checkout.session.completed
            # (obj.get("id") y désignerait l'ID de la session, pas celui de l'abonnement).
            quota.stripe_subscription_id = obj.get("subscription") or obj.get("id")
            logger.info(f"Quota mis à jour pour {user_id} : ABONNE")
            if emetteur:
                create_notification(
                    db, user_id, "EMAIL", emetteur.email,
                    "Votre abonnement est actif. Merci de votre confiance !",
                    sujet="Abonnement activé",
                )

        elif event_type == "customer.subscription.deleted":
            quota.statut = "ABONNEMENT_EXPIRE"
            logger.info(f"Quota mis à jour pour {user_id} : ABONNEMENT_EXPIRE")
            if emetteur:
                create_notification(
                    db, user_id, "EMAIL", emetteur.email,
                    "Votre abonnement a été annulé ou a expiré.",
                    sujet="Abonnement terminé",
                )

    db.commit()
    return {"received": True}


def _resolve_user_id(stripe_object: dict, db: Session) -> int | None:
    """Retrouve le user_id à partir des métadonnées de l'objet Stripe,
    ou via le customer_id enregistré sur UserQuota en dernier recours."""
    metadata = stripe_object.get("metadata", {}) or {}
    if metadata.get("user_id"):
        return int(metadata["user_id"])

    client_reference_id = stripe_object.get("client_reference_id")
    if client_reference_id and str(client_reference_id).isdigit():
        return int(client_reference_id)

    customer_id = stripe_object.get("customer")
    if customer_id:
        quota = db.query(UserQuota).filter(UserQuota.stripe_customer_id == customer_id).first()
        if quota:
            return quota.user_id
    return None