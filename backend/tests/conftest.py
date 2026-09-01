"""
conftest.py — Fixtures pytest pour les tests
Base de test configurable via TEST_DATABASE_URL :
  - PostgreSQL : $env:TEST_DATABASE_URL="postgresql+psycopg://postgres:admin@localhost:5432/salons_virtuels_test"
  - SQLite (défaut) : aucune variable requise → sqlite:///./test.db

Exemple : voir backend/.env.test
"""
import hashlib
import os
import pytest

# Forcer la configuration de test AVANT d'importer app.database / app.main
os.environ["TESTING"] = "1"
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite:///:memory:",
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Company, Role, Salon, Stand, User

# ─── Engine de test (SQLite en mémoire ou PostgreSQL) ──────────────────────
if TEST_DATABASE_URL.startswith("sqlite"):
    engine_kwargs = {
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    }
else:
    engine_kwargs = {"pool_pre_ping": True}

test_engine = create_engine(TEST_DATABASE_URL, **engine_kwargs)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def seed_roles(db) -> None:
    """Crée les rôles (obligatoire pour les FK PostgreSQL)."""
    for role in ("admin", "exporter", "importer"):
        if not db.query(Role).filter(Role.id == role).first():
            db.add(Role(id=role, name=role.capitalize(), description=f"Rôle {role}"))
    db.commit()


@pytest.fixture(scope="function")
def db():
    """Crée une DB de test fraîche pour chaque test."""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()

    # Seed des données de test
    seed_roles(db)

    admin = User(
        id="test-admin",
        email="admin@test.com",
        full_name="Admin Test",
        role_id="admin",
        hashed_password=hash_password("admin123"),
        status="VALIDE",
    )
    exporter_user = User(
        id="test-exporter-user",
        email="exporter@test.com",
        full_name="Exportateur Test",
        role_id="exporter",
        hashed_password=hash_password("export123"),
        status="VALIDE",
    )
    importer_user = User(
        id="test-importer-user",
        email="importer@test.com",
        full_name="Importateur Test",
        role_id="importer",
        hashed_password=hash_password("import123"),
        status="VALIDE",
    )
    db.add_all([admin, exporter_user, importer_user])

    exporter_co = Company(
        id="test-exporter-co",
        name="Export Test SA",
        is_exporter=True,
        is_importer=False,
        country="MA",
        description="Société d'export test",
        owner_id="test-exporter-user",
        profile_status="VALIDE",
    )
    importer_co = Company(
        id="test-importer-co",
        name="Import Test SARL",
        is_exporter=False,
        is_importer=True,
        country="FR",
        description="Société d'import test",
        owner_id="test-importer-user",
        profile_status="VALIDE",
    )
    db.add_all([exporter_co, importer_co])

    salon = Salon(
        id="test-salon",
        title="Salon Test",
        category="Test",
        start_date="2027-01-01",
        end_date="2027-01-03",
        stand_price=1000.0,
        status="VALIDE",
    )
    db.add(salon)
    db.commit()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db):
    """Client HTTP de test avec DB injectée."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token(client):
    """JWT pour l'administrateur de test."""
    response = client.post("/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def exporter_token(client):
    """JWT pour l'exportateur de test."""
    response = client.post("/auth/login", json={"email": "exporter@test.com", "password": "export123"})
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def importer_token(client):
    """JWT pour l'importateur de test."""
    response = client.post("/auth/login", json={"email": "importer@test.com", "password": "import123"})
    assert response.status_code == 200
    return response.json()["access_token"]
