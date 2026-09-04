import os
import logging
import json
import uuid
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


def _allow_dev_webhook_bypass() -> bool:
    return os.getenv("STRIPE_WEBHOOK_DEV_BYPASS", "false").strip().lower() == "true"


def _event_object_to_dict(value):
    if hasattr(value, "to_dict"):
        return value.to_dict()
    if isinstance(value, dict):
        return value
    try:
        return dict(value)
    except Exception:
        return {}


@router.post(
    "/webhooks/stripe",
    include_in_schema=False,
    summary="Webhook Stripe",
)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(
        default=None,
        alias="Stripe-Signature"
    ),
    db: Session = Depends(get_db),
):
    secret_key = os.getenv("STRIPE_SECRET_KEY")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not secret_key or not webhook_secret:
        logger.error("Stripe n'est pas configuré")
        raise HTTPException(
            status_code=503,
            detail="Stripe n'est pas configuré"
        )

    stripe.api_key = secret_key
    payload = await request.body()

    if _allow_dev_webhook_bypass() and stripe_signature == "test":
        event = None
        try:
            raw_payload = payload.decode("utf-8") or "{}"
            event = json.loads(raw_payload)
        except Exception:
            event = None

        if not isinstance(event, dict) or "type" not in event:
            query = request.query_params
            event_type = query.get("type") or query.get("event_type") or "payment_intent.succeeded"
            user_id = query.get("user_id") or query.get("userId") or "1"
            plan_id = query.get("plan_id") or query.get("planId") or "premium"
            amount = int(query.get("amount") or "5000")
            event = {
                "id": query.get("id") or f"dev_{uuid.uuid4().hex}",
                "type": event_type,
                "data": {
                    "object": {
                        "amount": amount,
                        "metadata": {
                            "user_id": str(user_id),
                            "plan_id": str(plan_id),
                        },
                    }
                },
            }
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload,
                stripe_signature,
                webhook_secret
            )
        except ValueError:
            logger.error("Payload Stripe invalide")
            raise HTTPException(
                status_code=400,
                detail="Payload webhook invalide"
            )
        except stripe.error.SignatureVerificationError:
            logger.error("Signature Stripe invalide")
            raise HTTPException(
                status_code=400,
                detail="Signature webhook invalide"
            )

    event_id = event["id"]
    event_type = event["type"]

    logger.info(
        "========== STRIPE WEBHOOK =========="
    )
    logger.info(
        "Event reçu : %s (%s)",
        event_type,
        event_id
    )

    # Événement déjà traité
    existing_event = (
        db.query(BillingEvent)
        .filter(
            BillingEvent.stripe_event_id == event_id
        )
        .first()
    )

    if existing_event:
        logger.info(
            "Événement déjà traité : %s",
            event_id
        )
        return {"received": True}

    obj = _event_object_to_dict(event["data"]["object"])

    # Retrouver l'utilisateur
    user_id = _resolve_user_id(obj, db)

    logger.info(
        "User ID résolu : %s",
        user_id
    )

    # Enregistrer l'événement
    db.add(
        BillingEvent(
            stripe_event_id=event_id,
            event_type=event_type,
            user_id=user_id
        )
    )

    if not user_id:
        logger.warning(
            "Impossible de retrouver le user_id pour %s",
            event_type
        )
        db.commit()
        return {"received": True}

    quota = _quota_for(user_id, db)
    emetteur = db.get(User, user_id)
# =========================================================
# 1. PAYMENT INTENT = UNIQUEMENT PAIEMENT À L'USAGE
# =========================================================

    if event_type == "payment_intent.succeeded":

        amount = obj.get("amount", 0) / 100
        metadata = obj.get("metadata", {}) or {}

        plan_id = metadata.get("plan_id")
        payment_type = metadata.get("type")

        logger.info(
            "PaymentIntent succeeded : user=%s plan_id=%s type=%s amount=%s",
            user_id,
            plan_id,
            payment_type,
            amount,
    )

    # IMPORTANT :
    # PaymentIntent = pay-per-use uniquement.
    # Premium ne passe jamais ici.
        if (
            plan_id == "pay-per-use"
            and payment_type == "usage"
        ):
            quota.depense_usage = (
                quota.depense_usage or 0
        ) + amount

        quota.statut = "PAIEMENT_USAGE"
        quota.is_premium = False

        logger.info(
            "Paiement à l'usage confirmé : user=%s montant=%.2f",
            user_id,
            amount,
        )

        if emetteur:
            try:
                create_notification(
                    db,
                    user_id,
                    "EMAIL",
                    emetteur.email,
                    f"Votre paiement de {amount:.2f} € a été confirmé.",
                    sujet="Paiement confirmé",
                )
            except Exception:
                logger.exception(
                    "Erreur notification paiement usage user=%s",
                    user_id,
                )


    # =========================================================
    # 2. CHECKOUT PREMIUM TERMINÉ
    # =========================================================

    elif event_type == "checkout.session.completed":

        mode = obj.get("mode")
        subscription_id = obj.get("subscription")

        logger.info(
            "Checkout terminé : mode=%s user=%s subscription=%s",
            mode   ,
            user_id,
            subscription_id,
    )

        if mode == "subscription":

            # Activation Premium
            quota.statut = "ABONNE"
            quota.is_premium = True
            quota.stripe_subscription_id = subscription_id

            logger.info(
                "========== PREMIUM ACTIVÉ =========="
        )
            logger.info(
                "user_id=%s",
                 user_id,
        )
            logger.info(
                "subscription=%s",
                subscription_id,
        )

        # Notification : ne doit PAS empêcher l'activation Premium
            if emetteur:
                try:
                    create_notification(
                        db,
                        user_id,
                        "EMAIL",
                        emetteur.email,
                        "Votre abonnement Premium est actif.",
                        sujet="Abonnement Premium activé",
                )
                except Exception:
                    logger.exception(
                        "Erreur notification Premium user=%s",
                        user_id
                )

    # =========================================================
    # 3. ABONNEMENT CRÉÉ
    # =========================================================

    elif event_type == "customer.subscription.created":

        subscription_id = obj.get("id")
        status = obj.get("status")
        
        quota.stripe_subscription_id = subscription_id
        if status in ("active" , "trialing"):
            quota.statut = "ABONNE"
            quota.is_premium = True
        logger.info(
            "Abonnement Premium créé : user=%s subscription=%s",
            user_id,
            subscription_id,
            status,
        )

    # =========================================================
    # 4. ABONNEMENT MODIFIÉ
    # =========================================================

    elif event_type == "customer.subscription.updated":

        subscription_id = obj.get("id")
        status = obj.get("status")

        logger.info(
            "Subscription updated : user=%s status=%s",
            user_id,
            status
        )

        quota.stripe_subscription_id = subscription_id

        if status in (
            "active",
            "trialing"
        ):
            quota.statut = "ABONNE"
            quota.is_premium = True

        elif status in (
            "canceled",
            "unpaid",
            "past_due"
        ):
            quota.statut = "GRATUIT"
            quota.is_premium = False

    # =========================================================
    # 5. ABONNEMENT SUPPRIMÉ
    # =========================================================

    elif event_type == "customer.subscription.deleted":

        quota.statut = "GRATUIT"
        quota.is_premium = False
        quota.stripe_subscription_id = None

        logger.info(
            "Abonnement Premium supprimé : user=%s",
            user_id
        )

        if emetteur:
            create_notification(
                db,
                user_id,
                "EMAIL",
                emetteur.email,
                "Votre abonnement Premium a été annulé.",
                sujet="Abonnement terminé",
            )


    logger.info(
    "AVANT COMMIT PREMIUM : user=%s statut=%s is_premium=%s subscription=%s",
    user_id,
    quota.statut,
    quota.is_premium,
    quota.stripe_subscription_id,
)
    # Sauvegarde finale
    db.commit()
    
    logger.info(
    "APRES COMMIT PREMIUM : user=%s statut=%s is_premium=%s",
    user_id,
    quota.statut,
    quota.is_premium,
)

    logger.info(
        "Quota final user=%s : statut=%s is_premium=%s subscription=%s",
        user_id,
        quota.statut,
        quota.is_premium,
        quota.stripe_subscription_id
    )

    return {"received": True}


def _resolve_user_id(stripe_object: dict, db: Session) -> int | None:
    """
    Retrouve le user_id à partir des métadonnées Stripe,
    du client_reference_id ou du customer Stripe.
    """

    metadata = stripe_object.get("metadata", {}) or {}

    # 1. metadata.user_id
    metadata_user_id = metadata.get("user_id")

    if metadata_user_id:
        try:
            return int(metadata_user_id)
        except (ValueError, TypeError):
            logger.warning(
                "user_id invalide dans metadata Stripe : %s",
                metadata_user_id,
            )

    # 2. client_reference_id
    client_reference_id = stripe_object.get(
        "client_reference_id"
    )

    if client_reference_id:
        if str(client_reference_id).isdigit():
            return int(client_reference_id)

    # 3. customer Stripe
    customer_id = stripe_object.get("customer")

    if customer_id:

        quota = (
            db.query(UserQuota)
            .filter(
                UserQuota.stripe_customer_id == customer_id
            )
            .first()
        )

        if quota:
            return quota.user_id

    logger.warning(
        "Aucun user_id trouvé pour customer=%s",
        customer_id,
    )

    return None