"""Tests du module messagerie : conversations, messages, cycle de statuts, quota de chats."""


def test_create_conversation(client, registered_user, second_user):
    r = client.post("/api/conversations", json={"destinataire_id": second_user["id"], "listing_id": None},
                     headers=registered_user["headers"])
    assert r.status_code == 201
    assert r.json()["statut"] == "SUGGEREE"


def test_create_conversation_avec_soi_meme_refuse(client, registered_user):
    r = client.post("/api/conversations", json={"destinataire_id": registered_user["id"], "listing_id": None},
                     headers=registered_user["headers"])
    assert r.status_code == 400


def test_envoyer_message_passe_conversation_en_contact(client, registered_user, second_user, mock_email):
    r = client.post("/api/conversations", json={"destinataire_id": second_user["id"], "listing_id": None},
                     headers=registered_user["headers"])
    conversation_id = r.json()["id"]

    r2 = client.post(f"/api/conversations/{conversation_id}/messages", json={"contenu": "Bonjour"},
                      headers=registered_user["headers"])
    assert r2.status_code == 201

    r3 = client.get("/api/conversations", headers=registered_user["headers"])
    conversation = next(c for c in r3.json() if c["id"] == conversation_id)
    assert conversation["statut"] == "EN_CONTACT"


def test_lire_messages_passe_conversation_en_consultee(client, registered_user, second_user):
    r = client.post("/api/conversations", json={"destinataire_id": second_user["id"], "listing_id": None},
                     headers=registered_user["headers"])
    conversation_id = r.json()["id"]

    r2 = client.get(f"/api/conversations/{conversation_id}/messages", headers=registered_user["headers"])
    assert r2.status_code == 200

    r3 = client.get("/api/conversations", headers=registered_user["headers"])
    conversation = next(c for c in r3.json() if c["id"] == conversation_id)
    assert conversation["statut"] == "CONSULTEE"


def test_changer_statut_conversation(client, registered_user, second_user):
    r = client.post("/api/conversations", json={"destinataire_id": second_user["id"], "listing_id": None},
                     headers=registered_user["headers"])
    conversation_id = r.json()["id"]

    r2 = client.put(f"/api/conversations/{conversation_id}/status", json={"statut": "CONCLUE"},
                     headers=registered_user["headers"])
    assert r2.status_code == 200
    assert r2.json()["statut"] == "CONCLUE"


def test_chat_counter_limit(client, registered_user, mock_email):
    """Le CDC impose 50 chats gratuits par compte, non renouvelables, avec blocage
    a la 51e tentative. On cree 50 conversations avec 50 destinataires differents,
    puis on verifie que la 51e est bloquee avec un 402."""
    destinataires = []
    for i in range(51):
        r = client.post("/api/auth/register", json={
            "nom": f"User {i}", "email": f"chatlimit{i}@example.com",
            "mot_de_passe": "TestPass123", "type_compte": "IMPORTATEUR", "pays": "France",
        })
        destinataires.append(r.json()["user"]["id"])

    for i in range(50):
        r = client.post("/api/conversations", json={"destinataire_id": destinataires[i], "listing_id": None},
                         headers=registered_user["headers"])
        assert r.status_code == 201, f"La conversation #{i + 1} aurait du reussir : {r.text}"

    r = client.post("/api/conversations", json={"destinataire_id": destinataires[50], "listing_id": None},
                     headers=registered_user["headers"])
    assert r.status_code == 402

    r_status = client.get("/api/billing/status", headers=registered_user["headers"])
    assert r_status.json()["statut"] == "LIMITE_ATTEINTE"
    assert r_status.json()["chats_utilises"] == 50