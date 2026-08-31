import stripe
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from app.config.config import settings
from app.config.database import get_db
from app.models.models import Billing, StatutFacturation, UserQuota

router = APIRouter()

STRIPE_WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET or "whsec_test_secret"
stripe.api_key = settings.STRIPE_SECRET_KEY or "sk_test_mock_key"

@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        import json
        event = json.loads(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur Webhook: {str(e)}")

    event_type = event.get("type")
    
    if event_type == "checkout.session.completed":
        session = event.get("data", {}).get("object", {})
        company_id = session.get("client_reference_id")
        
        if company_id:
            billing = db.query(Billing).filter(Billing.company_id == company_id).first()
            quota = db.query(UserQuota).filter(UserQuota.company_id == company_id).first()
            
            if billing and quota:
                metadata = session.get("metadata", {})
                type_paiement = metadata.get("type_paiement")
                amount_total = session.get("amount_total", 0) / 100.0
                
                billing.depense_cumulee_usage += amount_total
                
                if type_paiement == "abonnement":
                    billing.statut_facturation = StatutFacturation.ABONNE
                elif type_paiement == "pack":
                    billing.statut_facturation = StatutFacturation.PAIEMENT_USAGE
                    quota.chats_gratuits_restants += 100
                    
                db.commit()
                
                # Notification: Payment Confirmation
                from app.services.notification_service import notification_service
                notification_service.send_email(
                    db, billing.company.user.id, billing.company.user.email,
                    "Confirmation de paiement Stripe",
                    f"Votre paiement de {amount_total} USD a été validé avec succès. Merci de votre confiance."
                )

    elif event_type == "customer.subscription.deleted":
        subscription = event.get("data", {}).get("object", {})
        customer_id = subscription.get("customer")
        if customer_id:
            billing = db.query(Billing).filter(Billing.stripe_customer_id == customer_id).first()
            if billing:
                billing.statut_facturation = StatutFacturation.ABONNEMENT_EXPIRE
                db.commit()

    return {"status": "success"}
