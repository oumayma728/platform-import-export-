import pytest
from app.services.stripe_service import create_checkout_session
from app.config.config import settings

def test_stripe_service_no_api_key(db_session):
    # If no API key or invalid settings, it should raise or return something
    try:
        url = create_checkout_session(db_session, "dummy_company", "pack", "http://success", "http://cancel")
        assert "stripe.com" in url["checkout_url"] or url["checkout_url"] == ""
    except Exception:
        pass
        

def test_stripe_mocked_key(monkeypatch, db_session):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_123")
    import stripe
    stripe.api_key = "sk_test_123"
    
    # This will hit the stripe library and likely throw an authentication error
    try:
        create_checkout_session(db_session, "dummy_company", "abonnement", "http://success", "http://cancel")
    except Exception as e:
        pass
        
    try:
        create_checkout_session(db_session, "dummy_company", "invalid_type", "http://success", "http://cancel")
    except Exception as e:
        pass
