import pytest
from app.models.models import User, StatutValidation, Listing, StatutListing

@pytest.fixture
def auth_headers(client, db_session):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "listing@entreprise.com",
            "password": "Password123!",
            "company_name": "Listing Company",
            "type": "EXPORTATEUR",
            "pays": "France",
            "adresse": "123 Rue Test",
            "numero_tva": "FR12345678"
        }
    )
    token = response.json()["access_token"]
    
    # Manually validate company
    user_db = db_session.query(User).filter_by(email="listing@entreprise.com").first()
    user_db.company.statut_validation = StatutValidation.VALIDE
    db_session.commit()
    
    return {"Authorization": f"Bearer {token}"}

def test_crud_listing(client, auth_headers):
    # 1. Create Listing
    response = client.post(
        "/api/v1/listings/",
        headers=auth_headers,
        json={
            "type": "OFFRE",
            "titre": "Produit Test",
            "description": "Description du produit",
            "categorie": "TECH",
            "prix": 100.0,
            "quantite": 50,
            "pays": "France",
            "incoterms": "EXW",
            "delai_livraison": "10 jours",
            "certification": "ISO"
        }
    )
    assert response.status_code == 201
    listing_id = response.json()["id"]

    # 2. Get My Listings
    res_my = client.get("/api/v1/listings/me", headers=auth_headers)
    assert res_my.status_code == 200
    assert len(res_my.json()) >= 1

    # 3. Get specific Listing
    res_get = client.get(f"/api/v1/listings/{listing_id}", headers=auth_headers)
    assert res_get.status_code == 200
    assert res_get.json()["titre"] == "Produit Test"

    # 4. Search Listings
    res_search = client.get("/api/v1/listings/search?pays=France&categorie=TECH&prixMax=200", headers=auth_headers)
    assert res_search.status_code == 200
    assert len(res_search.json()) >= 1

    # 5. Update Listing
    res_update = client.put(
        f"/api/v1/listings/{listing_id}",
        headers=auth_headers,
        json={
            "titre": "Produit Test Updated",
            "prix": 150.0
        }
    )
    assert res_update.status_code == 200
    assert res_update.json()["titre"] == "Produit Test Updated"

    # 6. Close Listing
    res_close = client.patch(f"/api/v1/listings/{listing_id}/close", headers=auth_headers)
    assert res_close.status_code == 200
    assert res_close.json()["statut"] == "CLOTUREE"

    # 7. Delete Listing
    res_del = client.delete(f"/api/v1/listings/{listing_id}", headers=auth_headers)
    assert res_del.status_code == 204

def test_listing_unauthorized(client, auth_headers):
    # Try to get non-existent listing
    res = client.get("/api/v1/listings/unknown_id", headers=auth_headers)
    assert res.status_code == 404
