"""
test_auth.py — Tests d'authentification
"""
from fastapi.testclient import TestClient

from app.models import User


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_register_success(client: TestClient):
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@test.com",
            "password": "password123",
            "full_name": "New User",
            "role": "exporter"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["role_id"] == "exporter"
    assert data["status"] == "EN_ATTENTE_VALIDATION"


def test_register_duplicate_email(client: TestClient):
    response = client.post(
        "/auth/register",
        json={
            "email": "admin@test.com",  # Already in DB from seed
            "password": "password123",
            "full_name": "Duplicate User",
            "role": "importer"
        }
    )
    assert response.status_code == 400


def test_login_success(client: TestClient):
    response = client.post(
        "/auth/login",
        json={"email": "admin@test.com", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@test.com"


def test_login_invalid_password(client: TestClient):
    response = client.post(
        "/auth/login",
        json={"email": "admin@test.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_get_me(client: TestClient, exporter_token: str):
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {exporter_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "exporter@test.com"


# ─── Compléments de couverture ───────────────────────────────────────────────
def test_get_me_no_token(client: TestClient):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_get_profile_alias(client: TestClient, exporter_token: str):
    response = client.get("/auth/profile", headers=_auth(exporter_token))
    assert response.status_code == 200
    assert response.json()["email"] == "exporter@test.com"


def test_refresh_token_success(client: TestClient, exporter_token: str):
    login = client.post("/auth/login", json={"email": "exporter@test.com", "password": "export123"})
    refresh = login.json()["refresh_token"]
    resp = client.post("/auth/refresh", params={"refresh_token": refresh})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "exporter@test.com"


def test_refresh_token_invalid(client: TestClient):
    resp = client.post("/auth/refresh", params={"refresh_token": "token.invalide.abc"})
    assert resp.status_code == 401


def test_refresh_token_wrong_type(client: TestClient, exporter_token: str):
    # Un access token n'est pas un refresh token
    resp = client.post("/auth/refresh", params={"refresh_token": exporter_token})
    assert resp.status_code == 401


def test_verify_email_success(client: TestClient, db):
    reg = client.post(
        "/auth/register",
        json={"email": "verify@test.com", "password": "pw123", "full_name": "Vérif", "role_id": "exporter"},
    )
    assert reg.status_code == 201
    user = db.query(User).filter(User.email == "verify@test.com").first()
    assert user.email_verification_token is not None

    resp = client.get("/auth/verify-email", params={"token": user.email_verification_token})
    assert resp.status_code == 200
    db.refresh(user)
    assert user.is_email_verified is True
    assert user.email_verification_token is None


def test_verify_email_invalid_token(client: TestClient):
    resp = client.get("/auth/verify-email", params={"token": "inexistant"})
    assert resp.status_code == 400


def test_update_profile(client: TestClient, exporter_token: str):
    resp = client.put("/auth/profile", headers=_auth(exporter_token), json={"full_name": "Nouveau Nom"})
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Nouveau Nom"


def test_update_profile_email_taken(client: TestClient, exporter_token: str):
    resp = client.put("/auth/profile", headers=_auth(exporter_token), json={"email": "admin@test.com"})
    assert resp.status_code == 400


def test_list_users_admin(client: TestClient, admin_token: str):
    resp = client.get("/auth/users", headers=_auth(admin_token))
    assert resp.status_code == 200
    emails = [u["email"] for u in resp.json()]
    assert "admin@test.com" in emails


def test_list_users_forbidden_for_exporter(client: TestClient, exporter_token: str):
    resp = client.get("/auth/users", headers=_auth(exporter_token))
    assert resp.status_code == 403


def test_validate_user_admin(client: TestClient, admin_token: str, db):
    client.post(
        "/auth/register",
        json={"email": "tovalidate@test.com", "password": "pw123", "full_name": "TV", "role_id": "exporter"},
    )
    user = db.query(User).filter(User.email == "tovalidate@test.com").first()
    assert user.status == "EN_ATTENTE_VALIDATION"

    resp = client.patch(f"/auth/users/{user.id}/validate", headers=_auth(admin_token))
    assert resp.status_code == 200
    assert resp.json()["status"] == "VALIDE"


def test_validate_user_404(client: TestClient, admin_token: str):
    resp = client.patch("/auth/users/inexistant/validate", headers=_auth(admin_token))
    assert resp.status_code == 404
