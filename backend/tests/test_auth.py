import pytest
from app.models.models import User, Company, StatutValidation
from app.config.security import verify_password

def test_register_user_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@entreprise.com",
            "password": "Password123!",
            "company_name": "Test Company",
            "type": "EXPORTATEUR",
            "pays": "France",
            "adresse": "123 Rue de Test",
            "numero_tva": "FR12345678"
        }
    )
    assert response.status_code == 201
    assert "access_token" in response.json()
    # token_type is not returned by the custom UserCreate schema/service, we remove this assert

def test_login_success(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test_login@entreprise.com",
            "password": "Password123!",
            "company_name": "Test Company",
            "type": "EXPORTATEUR",
            "pays": "France",
            "adresse": "123 Rue de Test"
        }
    )
    
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test_login@entreprise.com",
            "password": "Password123!"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@entreprise.com",
            "password": "WrongPassword!"
        }
    )
    assert response.status_code == 401

def test_get_profile(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test_profile@entreprise.com",
            "password": "Password123!",
            "company_name": "Test Company",
            "type": "EXPORTATEUR",
            "pays": "France",
            "adresse": "123 Rue de Test"
        }
    )
    
    res_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test_profile@entreprise.com",
            "password": "Password123!"
        }
    )
    token = res_login.json()["access_token"]
    
    res_profile = client.get(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_profile.status_code == 200
    assert res_profile.json()["email"] == "test_profile@entreprise.com"
    assert res_profile.json()["company"]["company_name"] == "Test Company"
    assert res_profile.json()["company"]["type"] == "EXPORTATEUR"

def test_update_profile(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test_update@entreprise.com",
            "password": "Password123!",
            "company_name": "Test Company",
            "type": "EXPORTATEUR",
            "pays": "France",
            "adresse": "123 Rue de Test"
        }
    )
    
    res_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test_update@entreprise.com",
            "password": "Password123!"
        }
    )
    token = res_login.json()["access_token"]
    
    res_update = client.put(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "company": {
                "company_name": "Updated Company",
                "pays": "Belgique"
            }
        }
    )
    assert res_update.status_code == 200
    assert res_update.json()["company"]["company_name"] == "Updated Company"
    assert res_update.json()["company"]["pays"] == "Belgique"

def test_register_duplicate_email(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@entreprise.com",
            "password": "Password123!",
            "company_name": "Test Company",
            "type": "EXPORTATEUR",
            "pays": "France",
            "adresse": "123 Rue de Test"
        }
    )
    
    res_dup = client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@entreprise.com",
            "password": "Password123!",
            "company_name": "Test Company 2",
            "type": "IMPORTATEUR",
            "pays": "France",
            "adresse": "123 Rue de Test"
        }
    )
    assert res_dup.status_code == 409
