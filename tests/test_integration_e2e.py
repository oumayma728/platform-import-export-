

def test_parcours_complet_inscription_annonce_message_paiement(
    client, mock_logistics, mock_email, mock_stripe_payment_intent
):
    # 1. Inscription de l'exportateur
    r = client.post("/api/auth/register", json={
        "nom": "Exportateur E2E", "email": "exportateur.e2e@example.com",
        "mot_de_passe": "TestPass123", "type_compte": "EXPORTATEUR", "pays": "Tunisie",
    })
    assert r.status_code == 201
    exportateur = {"headers": {"Authorization": f"Bearer {r.json()['access_token']}"}, "id": r.json()["user"]["id"]}

    # 2. Inscription de l'importateur (destinataire du message)
    r = client.post("/api/auth/register", json={
        "nom": "Importateur E2E", "email": "importateur.e2e@example.com",
        "mot_de_passe": "TestPass123", "type_compte": "IMPORTATEUR", "pays": "France",
    })
    assert r.status_code == 201
    importateur = {"headers": {"Authorization": f"Bearer {r.json()['access_token']}"}, "id": r.json()["user"]["id"]}

    # 3. L'exportateur crée une annonce (avec enrichissement logistique mocké)
    r = client.post("/api/listings", json={
        "titre": "Huile d'olive extra vierge", "type": "offre", "categorie": "Agroalimentaire",
        "quantite": 1000, "prix": 5000, "devise": "TND",
        "pays_origine": "TN", "pays_destination": "FR", "documents": [],
    }, headers=exportateur["headers"])
    assert r.status_code == 201
    listing_id = r.json()["id"]
    assert r.json()["distance_km"] == 1500.0  # valeur du mock_logistics

    # 4. L'importateur consulte l'annonce
    r = client.get(f"/api/listings/{listing_id}")
    assert r.status_code == 200

    # 5. L'importateur initie une conversation liée à cette annonce
    r = client.post("/api/conversations", json={"destinataire_id": exportateur["id"], "listing_id": listing_id},
                     headers=importateur["headers"])
    assert r.status_code == 201
    conversation_id = r.json()["id"]
    assert r.json()["statut"] == "SUGGEREE"

    # 6. L'importateur envoie un message -> déclenche une notification (mockée) à l'exportateur
    r = client.post(f"/api/conversations/{conversation_id}/messages", json={
        "contenu": "Bonjour, je suis intéressé par votre offre d'huile d'olive.",
    }, headers=importateur["headers"])
    assert r.status_code == 201

    r = client.get("/api/conversations", headers=importateur["headers"])
    conversation = next(c for c in r.json() if c["id"] == conversation_id)
    assert conversation["statut"] == "EN_CONTACT"

    # 7. L'exportateur répond
    r = client.post(f"/api/conversations/{conversation_id}/messages", json={
        "contenu": "Bonjour, oui le produit est disponible, voulez-vous un devis ?",
    }, headers=exportateur["headers"])
    assert r.status_code == 201

    # 8. Négociation conclue -> statut mis à jour manuellement
    r = client.put(f"/api/conversations/{conversation_id}/status", json={"statut": "CONCLUE"},
                    headers=exportateur["headers"])
    assert r.status_code == 200
    assert r.json()["statut"] == "CONCLUE"

    # 9. L'importateur paie l'accès à l'usage (Stripe mocké)
    r = client.post("/api/billing/create-payment-intent", json={"amount": 2000, "currency": "usd"},
                     headers=importateur["headers"])
    assert r.status_code == 200
    assert r.json()["client_secret"] == "pi_test_secret_123"

    # 10. Vérification finale : l'importateur voit bien la notification de nouveau message reçue plus tôt
    r = client.get("/api/notifications/me", headers=exportateur["headers"])
    assert r.status_code == 200
    assert any(n["sujet"] == "Nouveau message" for n in r.json())