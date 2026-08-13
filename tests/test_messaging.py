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
    
def test_reouvrir_conversation_existante_ne_bloque_pas_meme_a_la_limite(client, registered_user, mock_email):
    """Réouvrir une conversation déjà existante (même destinataire + même listing)
    ne doit JAMAIS être bloqué par le quota, même si les 50 chats gratuits sont épuisés.
    Seule la création d'une VRAIE nouvelle conversation doit être comptée et bloquée."""
    destinataires = []
    for i in range(50):
        r = client.post("/api/auth/register", json={
            "nom": f"User Reopen {i}", "email": f"reopen{i}@example.com",
            "mot_de_passe": "TestPass123", "type_compte": "IMPORTATEUR", "pays": "France",
        })
        destinataires.append(r.json()["user"]["id"])

    # Épuiser les 50 chats gratuits
    for i in range(50):
        r = client.post("/api/conversations", json={"destinataire_id": destinataires[i], "listing_id": None},
                         headers=registered_user["headers"])
        assert r.status_code == 201, f"La conversation #{i + 1} aurait du reussir : {r.text}"

    # Vérifier que le quota est bien épuisé
    r_status = client.get("/api/billing/status", headers=registered_user["headers"])
    assert r_status.json()["chats_utilises"] == 50

    # Rouvrir la toute première conversation (même destinataire, même listing_id=None)
    # -> ce n'est PAS un nouveau chat, ça doit réussir malgré le quota épuisé
    r_reopen = client.post("/api/conversations", json={"destinataire_id": destinataires[0], "listing_id": None},
                            headers=registered_user["headers"])
    assert r_reopen.status_code == 201, (
        f"Rouvrir une conversation existante ne devrait jamais être bloqué par le quota : {r_reopen.text}"
    )

    # Le quota ne doit pas avoir bougé (toujours 50, pas 51)
    r_status_apres = client.get("/api/billing/status", headers=registered_user["headers"])
    assert r_status_apres.json()["chats_utilises"] == 50

    # Une VRAIE nouvelle conversation, elle, doit rester bloquée
    r_nouveau = client.post("/api/auth/register", json={
        "nom": "User Nouveau", "email": "nouveau.destinataire@example.com",
        "mot_de_passe": "TestPass123", "type_compte": "IMPORTATEUR", "pays": "France",
    })
    nouveau_destinataire_id = r_nouveau.json()["user"]["id"]

    r_bloque = client.post("/api/conversations", json={"destinataire_id": nouveau_destinataire_id, "listing_id": None},
                            headers=registered_user["headers"])
    assert r_bloque.status_code == 402