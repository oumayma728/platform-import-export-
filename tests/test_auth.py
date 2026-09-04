"""Tests du module authentification : inscription, connexion, refresh token."""


def test_register_user_success(client):
    payload = {
        "nom": "Amine Ben Ali",
        "email": "amine@example.com",
        "mot_de_passe": "MotDePasse123",
        "type_compte": "EXPORTATEUR",
        "pays": "Tunisie",
    }
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "amine@example.com"
    # Le mot de passe ne doit jamais apparaître dans la réponse
    assert "mot_de_passe" not in data["user"]


def test_register_user_email_deja_utilise(client, registered_user):
    payload = {
        "nom": "Doublon",
        "email": registered_user["email"],
        "mot_de_passe": "AutreMotDePasse123",
        "type_compte": "EXPORTATEUR",
        "pays": "Tunisie",
    }
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 409


def test_register_mot_de_passe_trop_faible(client):
    payload = {
        "nom": "Test",
        "email": "faible@example.com",
        "mot_de_passe": "abcdefgh",  # pas de majuscule, pas de chiffre
        "type_compte": "EXPORTATEUR",
        "pays": "Tunisie",
    }
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 422


def test_register_user_accepts_front_compat_fields(client):
    payload = {
        "nom": "Front Compatible",
        "email": "front.compat@example.com",
        "password": "MotDePasse123",
        "role": "IMPORTATEUR",
        "pays": "Tunisie",
    }
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 201, r.text
    assert r.json()["user"]["email"] == "front.compat@example.com"


def test_login_success(client, registered_user):
    r = client.post("/api/auth/login", json={
        "email": registered_user["email"], "mot_de_passe": "TestPass123",
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_accepts_front_password_alias(client, registered_user):
    r = client.post("/api/auth/login", json={
        "email": registered_user["email"], "password": "TestPass123",
    })
    assert r.status_code == 200, r.text
    assert "access_token" in r.json()


def test_login_invalid_credentials(client, registered_user):
    r = client.post("/api/auth/login", json={
        "email": registered_user["email"], "mot_de_passe": "MauvaisMotDePasse",
    })
    assert r.status_code == 401


def test_login_email_inexistant(client):
    r = client.post("/api/auth/login", json={
        "email": "inconnu@example.com", "mot_de_passe": "PeuImporte123",
    })
    assert r.status_code == 401


def test_refresh_token_flow(client, registered_user):
    r = client.post("/api/auth/login", json={
        "email": registered_user["email"], "mot_de_passe": "TestPass123",
    })
    refresh_token = r.json()["refresh_token"]

    r2 = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert r2.status_code == 200
    assert "access_token" in r2.json()


def test_refresh_token_invalide(client):
    r = client.post("/api/auth/refresh", json={"refresh_token": "un-faux-token-qui-nexiste-pas"})
    assert r.status_code == 401


def test_profile_necessite_authentification(client):
    r = client.get("/api/auth/profile")
    assert r.status_code == 401


def test_profile_avec_authentification(client, registered_user):
    r = client.get("/api/auth/profile", headers=registered_user["headers"])
    assert r.status_code == 200
    assert r.json()["email"] == registered_user["email"]


def test_update_profile(client, registered_user):
    r = client.put("/api/auth/profile", json={"nom": "Nouveau Nom"}, headers=registered_user["headers"])
    assert r.status_code == 200
    assert r.json()["nom"] == "Nouveau Nom"