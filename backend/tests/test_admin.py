import pytest
from app.models.models import User, Role, Company

@pytest.fixture
def admin_headers(client, db_session):
    # Register an admin user
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@entreprise.com",
            "password": "Password123!",
            "company_name": "Admin Company",
            "type": "EXPORTATEUR",
            "pays": "France",
            "adresse": "123",
            "numero_tva": "123"
        }
    )
    token = response.json()["access_token"]
    
    # Manually set role to ADMIN
    user_db = db_session.query(User).filter_by(email="admin@entreprise.com").first()
    user_db.role = Role.ADMIN
    db_session.commit()
    
    return {"Authorization": f"Bearer {token}"}

def test_admin_flow(client, admin_headers, db_session):
    # Register a standard user to be validated
    res_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "tobevalidated@entreprise.com",
            "password": "Password123!",
            "company_name": "To Be Validated Company",
            "type": "IMPORTATEUR",
            "pays": "France",
            "adresse": "123",
            "numero_tva": "123"
        }
    )
    assert res_reg.status_code == 201
    
    # Get the company id directly from DB (since there's no /pending route)
    user_db = db_session.query(User).filter_by(email="tobevalidated@entreprise.com").first()
    company_id_to_validate = user_db.company.id

    # Admin validates the company
    res_val = client.patch(f"/api/v1/admin/companies/{company_id_to_validate}/status?statut=VALIDE", headers=admin_headers)
    assert res_val.status_code == 200
    assert res_val.json()["statut_validation"] == "VALIDE"

def test_admin_unauthorized(client):
    # Try to access admin route without token
    res = client.patch("/api/v1/admin/companies/dummy_id/status?statut=VALIDE")
    assert res.status_code == 403 or res.status_code == 401
