import pytest
from app.models.models import UserQuota, Company, User, StatutValidation

@pytest.fixture
def test_users(client, db_session):
    # Register user 1 (Initiator)
    res1 = client.post("/api/v1/auth/register", json={
        "email": "initiator@entreprise.com", "password": "Password123!",
        "company_name": "Initiator Company", "type": "IMPORTATEUR",
        "pays": "France", "adresse": "123", "numero_tva": "123"
    })
    token1 = res1.json()["access_token"]
    
    # Register user 2 (Listing Owner)
    res2 = client.post("/api/v1/auth/register", json={
        "email": "owner@entreprise.com", "password": "Password123!",
        "company_name": "Owner Company", "type": "EXPORTATEUR",
        "pays": "France", "adresse": "123", "numero_tva": "123"
    })
    token2 = res2.json()["access_token"]
    
    # Validate owner's company so they can create a listing
    owner = db_session.query(User).filter_by(email="owner@entreprise.com").first()
    owner.company.statut_validation = StatutValidation.VALIDE
    db_session.commit()
    
    # Create listing by user 2
    res_list = client.post("/api/v1/listings/", headers={"Authorization": f"Bearer {token2}"}, json={
        "type": "OFFRE", "titre": "Produit Test", "description": "Desc",
        "categorie": "TECH", "prix": 100.0, "quantite": 50,
        "pays": "France"
    })
    listing_id = res_list.json()["id"]
    
    return {"token_init": token1, "token_owner": token2, "listing_id": listing_id}

def test_chat_counter_limit(client, db_session, test_users):
    # Manually exhaust the quota for initiator
    initiator = db_session.query(User).filter_by(email="initiator@entreprise.com").first()
    quota = db_session.query(UserQuota).filter_by(company_id=initiator.company.id).first()
    quota.chats_gratuits_restants = 0
    db_session.commit()
    
    # Try to start a conversation
    response = client.post(
        "/api/v1/messaging/conversations",
        headers={"Authorization": f"Bearer {test_users['token_init']}"},
        json={"listing_id": test_users['listing_id']}
    )
    
    assert response.status_code == 402
    assert "Quota de 50 conversations gratuites dépassé" in response.json()["detail"]

def test_messaging_endpoints(client, db_session, test_users):
    headers = {"Authorization": f"Bearer {test_users['token_init']}"}
    
    # Create conversation
    res_conv = client.post(
        "/api/v1/messaging/conversations",
        headers=headers,
        json={"listing_id": test_users['listing_id']}
    )
    assert res_conv.status_code == 200
    conv_id = res_conv.json()["id"]

    # List conversations
    res_list = client.get("/api/v1/messaging/conversations", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1
    
    # Get messages
    res_msgs = client.get(f"/api/v1/messaging/conversations/{conv_id}/messages", headers=headers)
    assert res_msgs.status_code == 200

    # Upload document (simulated via invalid file type to hit the 400 branch)
    from io import BytesIO
    res_doc = client.post(
        f"/api/v1/messaging/messages/{conv_id}/documents?message_id=test",
        headers=headers,
        files={"file": ("test.txt", BytesIO(b"test"), "text/plain")}
    )
    assert res_doc.status_code == 400
    
    # Upload document valid (mocked message_id)
    # This might fail with 404 if message_id is not found, but it hits the code branch
    res_doc_valid = client.post(
        f"/api/v1/messaging/messages/{conv_id}/documents?message_id=invalid_id",
        headers=headers,
        files={"file": ("test.pdf", BytesIO(b"%PDF-1.4"), "application/pdf")}
    )
    # The service will throw 404 because "invalid_id" message doesn't exist
    assert res_doc_valid.status_code == 404
