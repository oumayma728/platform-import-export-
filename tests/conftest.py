
import os
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("JWT_SECRET", "test-secret-key-for-tests-only")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_fake_for_tests")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_fake_for_tests")
os.environ.setdefault("LOGISTICS_API_KEY", "fake_key_for_tests")
os.environ.setdefault("GMAIL_ADDRESS", "test@gmail.com")
os.environ.setdefault("GMAIL_APP_PASSWORD", "fake-password")
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://postgres:2314164@localhost:5432/import_export_test_db",
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

# IMPORTANT : cet import doit rester APRES avoir défini DATABASE_URL ci-dessus,
# car app/config/database.py lit cette variable au moment de l'import
# (engine = create_engine(DATABASE_URL)). Si l'import est placé avant, le module
# se charge avec DATABASE_URL=None -> ArgumentError au lancement de pytest.
from app.config.database import Base, get_db  # noqa: E402
import main as main_module  # noqa: E402



engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _creer_tables_de_test():
    """Crée toutes les tables une fois au début de la session de tests,
    les supprime toutes à la fin. Nécessite que TEST_DATABASE_URL pointe
    vers une base PostgreSQL dédiée aux tests (jamais la base de dev/prod)."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """Une session par test, encapsulée dans une transaction annulée à la fin."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    """Client de test FastAPI, branché sur la session de test isolée."""
    def _override_get_db():
        yield db_session

    main_module.app.dependency_overrides[get_db] = _override_get_db
    with TestClient(main_module.app) as c:
        yield c
    main_module.app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client):
    """Crée un utilisateur de test et renvoie (headers d'authentification, user_id, email)."""
    payload = {
        "nom": "Test User",
        "email": "test.user@example.com",
        "mot_de_passe": "TestPass123",
        "type_compte": "EXPORTATEUR",
        "pays": "Tunisie",
    }
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 201, r.text
    data = r.json()
    token = data["access_token"]
    return {"headers": {"Authorization": f"Bearer {token}"}, "id": data["user"]["id"], "email": payload["email"]}


@pytest.fixture()
def second_user(client):
    """Un deuxième utilisateur, utile pour les tests de messagerie (2 participants requis)."""
    payload = {
        "nom": "Second User",
        "email": "second.user@example.com",
        "mot_de_passe": "TestPass123",
        "type_compte": "IMPORTATEUR",
        "pays": "France",
    }
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 201, r.text
    data = r.json()
    return {"headers": {"Authorization": f"Bearer {data['access_token']}"}, "id": data["user"]["id"]}


# ---------------------------------------------------------------------------
# Mocks des services externes : jamais de vrai appel réseau pendant les tests
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_stripe_payment_intent():
    """Simule stripe.PaymentIntent.create() sans appeler le vrai Stripe."""
    fake_intent = MagicMock(client_secret="pi_test_secret_123", id="pi_test_123")
    with patch("app.routes.billing.stripe.PaymentIntent.create", return_value=fake_intent) as m:
        yield m


@pytest.fixture()
def mock_stripe_checkout_session():
    """Simule stripe.Customer.create() + stripe.checkout.Session.create()."""
    fake_customer = MagicMock(id="cus_test_123")
    fake_session = MagicMock(url="https://checkout.stripe.com/test", id="cs_test_123")
    with patch("app.routes.billing.stripe.Customer.create", return_value=fake_customer), \
         patch("app.routes.billing.stripe.checkout.Session.create", return_value=fake_session) as m:
        yield m


@pytest.fixture()
def mock_stripe_webhook_event():
    """Fabrique un faux événement Stripe déjà 'vérifié' (contourne la vérification
    de signature, qui est testée séparément dans test_billing.py)."""
    def _make(event_type: str, object_data: dict, event_id: str = "evt_test_123"):
        fake_event = {
            "id": event_id,
            "type": event_type,
            "data": {"object": MagicMock(to_dict=lambda: object_data)},
        }
        return fake_event
    return _make



@pytest.fixture()
def mock_email():
    with patch("smtplib.SMTP_SSL") as smtp:
        yield smtp


@pytest.fixture()
def mock_twilio():
    with patch("app.services.sms_service.Client") as m:
        instance = m.return_value
        instance.messages.create.return_value = MagicMock(sid="SM_test_123")
        yield instance


@pytest.fixture()
def mock_logistics():
    """Évite tout appel réseau vers OpenRouteService pendant les tests."""
    async def _fake_estimate(origin, destination, cost_per_km=0.75):
        return {
            "origin": origin.upper(),
            "destination": destination.upper(),
            "distance_km": 1500.0,
            "estimated_cost_usd": 1125.0,
            "estimated_days": 3,
        }
    with patch("app.controllers.listing_controller.logistics_estimate", side_effect=_fake_estimate) as m:
        yield m


@pytest.fixture()
def mock_currency():
    """Évite tout appel réseau vers l'API de taux de change pendant les tests."""
    async def _fake_convert(amount, from_currency, to_currency):
        taux = 0.32  # taux fictif fixe pour des résultats de test reproductibles
        return {
            "amount": amount, "from": from_currency.upper(), "to": to_currency.upper(),
            "converted_amount": round(amount * taux, 2), "rate": taux,
        }
    with patch("app.controllers.listing_controller.currency_convert", side_effect=_fake_convert) as m:
        yield m