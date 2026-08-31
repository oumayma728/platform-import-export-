import pytest

def test_full_flow_end_to_end(client, db_session):
    # 1. Inscription
    res_reg = client.post("/api/v1/auth/register", json={
        "email": "e2e@entreprise.com", "password": "Password123!",
        "company_name": "E2E Company", "type": "EXPORTATEUR",
        "pays": "France", "adresse": "123 Rue Test", "numero_tva": "FR123"
    })
    assert res_reg.status_code == 201
    token = res_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Manually validate company in DB
    from app.models.models import User, StatutValidation
    user_db = db_session.query(User).filter_by(email="e2e@entreprise.com").first()
    user_db.company.statut_validation = StatutValidation.VALIDE
    db_session.commit()
    
    # 2. Création d'une annonce
    res_list = client.post("/api/v1/listings/", headers=headers, json={
        "type": "OFFRE", "titre": "E2E Produit", "description": "Desc",
        "categorie": "TECH", "prix": 1000.0, "quantite": 10,
        "pays": "France", "incoterms": "FOB", "delai_livraison": "30 jours"
    })
    assert res_list.status_code == 201
    listing_id = res_list.json()["id"]
    
    # 3. Inscription d'un acheteur
    res_reg_buyer = client.post("/api/v1/auth/register", json={
        "email": "buyer@entreprise.com", "password": "Password123!",
        "company_name": "Buyer Company", "type": "IMPORTATEUR",
        "pays": "Canada", "adresse": "456 Ave Test", "numero_tva": "CA123"
    })
    buyer_token = res_reg_buyer.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    
    # 4. Acheteur envoie un message (Initie conversation)
    res_msg = client.post(
        "/api/v1/messaging/conversations", 
        headers=buyer_headers, 
        json={"listing_id": listing_id}
    )
    assert res_msg.status_code == 200
    conv_id = res_msg.json()["id"]
    
    # 5. Acheteur récupère les messages
    res_get_msg = client.get(f"/api/v1/messaging/conversations/{conv_id}/messages", headers=buyer_headers)
    assert res_get_msg.status_code == 200
    
    # 6. Mise à jour du statut de la conversation
    res_status = client.put(f"/api/v1/messaging/conversations/{conv_id}/status", headers=buyer_headers, json={"statut": "EN_NEGOCIATION"})
    assert res_status.status_code == 200
    
    # 5. Paiement (Webhook de test)
    # Get buyer company id to simulate payment
    buyer_profile = client.get("/api/v1/auth/profile", headers=buyer_headers)
    buyer_company_id = buyer_profile.json()["company"]["id"]
    
    webhook_payload = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": buyer_company_id,
                "amount_total": 9900,
                "metadata": {"type_paiement": "pack"}
            }
        }
    }
    res_hook = client.post("/api/v1/webhooks/stripe", json=webhook_payload)
    assert res_hook.status_code == 200
