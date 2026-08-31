import pytest
from app.models.models import User, Company, Billing, StatutFacturation

def test_stripe_webhook_payment_success(client, db_session):
    # Setup test company
    response = client.post("/api/v1/auth/register", json={
        "email": "billing@entreprise.com", "password": "Password123!",
        "company_name": "Billing Company", "type": "EXPORTATEUR",
        "pays": "France", "adresse": "123", "numero_tva": "123"
    })
    token = response.json()["access_token"]
    
    user = db_session.query(User).filter_by(email="billing@entreprise.com").first()
    company_id = user.company.id
    
    billing = db_session.query(Billing).filter_by(company_id=company_id).first()
    assert billing.statut_facturation == StatutFacturation.GRATUIT
    
    # 1. Get Billing info
    res_info = client.get("/api/v1/billing/status", headers={"Authorization": f"Bearer {token}"})
    assert res_info.status_code == 200
    assert "statut_facturation" in res_info.json()
    
    # 2. Simulate Checkout creation (mocked implicitly since we can't fully mock stripe without monkeypatch easily, 
    # but the endpoint might just return a URL if stripe is installed).
    # Since stripe expects an API key, this might fail with 500 if the key is invalid.
    # We will test the webhook.
    
    # Simulate webhook
    webhook_payload = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": company_id,
                "amount_total": 5000, # 50.00 USD
                "metadata": {
                    "type_paiement": "abonnement"
                }
            }
        }
    }
    
    res = client.post("/api/v1/webhooks/stripe", json=webhook_payload)
    assert res.status_code == 200
    
    # Check updated billing status
    db_session.refresh(billing)
    assert billing.statut_facturation == StatutFacturation.ABONNE
    assert billing.depense_cumulee_usage == 50.0

def test_webhook_usage_payment(client, db_session):
    # Setup test company
    response = client.post("/api/v1/auth/register", json={
        "email": "billing2@entreprise.com", "password": "Password123!",
        "company_name": "Billing Company 2", "type": "EXPORTATEUR",
        "pays": "France", "adresse": "123", "numero_tva": "123"
    })
    
    user = db_session.query(User).filter_by(email="billing2@entreprise.com").first()
    company_id = user.company.id
    
    webhook_payload = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": company_id,
                "amount_total": 9900,
                "metadata": {
                    "type_paiement": "pack"
                }
            }
        }
    }
    
    res = client.post("/api/v1/webhooks/stripe", json=webhook_payload)
    assert res.status_code == 200
    
    billing = db_session.query(Billing).filter_by(company_id=company_id).first()
    assert billing.depense_cumulee_usage == 99.0
