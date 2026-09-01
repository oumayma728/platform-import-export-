"""
test_messaging.py — Tests de la messagerie et de la gestion du quota de messages
"""
from fastapi.testclient import TestClient
from app.models import Conversation, Stand, UserQuota


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _seed_stand_and_conv(db, stand_id="test-stand-msg2", conv_id="test-conv-msg2", status="SUGGEREE"):
    stand = Stand(
        id=stand_id,
        salon_id="test-salon",
        exporter_id="test-exporter-co",
        company_name="Export Stand",
        status="VALIDE",
    )
    db.add(stand)
    conv = Conversation(
        id=conv_id,
        stand_id=stand_id,
        importer_id="test-importer-co",
        status=status,
    )
    db.add(conv)
    db.commit()
    return stand, conv


def test_create_conversation(client: TestClient, importer_token: str, db):
    """Test de création d'une conversation entre importateur et exportateur."""
    # Créer un stand de test validé
    stand = Stand(
        id="test-stand-msg",
        salon_id="test-salon",
        exporter_id="test-exporter-co",
        company_name="Export Stand Msg",
        status="VALIDE"
    )
    db.add(stand)
    db.commit()

    response = client.post(
        "/conversations/",
        headers={"Authorization": f"Bearer {importer_token}"},
        json={
            "importer_id": "test-importer-co",
            "stand_id": "test-stand-msg",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["importer_id"] == "test-importer-co"
    assert data["stand_id"] == "test-stand-msg"


def test_chat_counter_limit(client: TestClient, importer_token: str, db):
    """Test unit/intégration vérifiant le blocage (402) quand le quota de chat est atteint."""
    # Simuler un quota épuisé pour l'utilisateur importateur
    quota = db.query(UserQuota).filter(UserQuota.user_id == "test-importer-user").first()
    if not quota:
        quota = UserQuota(user_id="test-importer-user")
        db.add(quota)
    quota.chats_used = 50  # Quota atteint (FREE_CHAT_LIMIT = 50)
    quota.status = "LIMITE_ATTEINTE"
    db.commit()

    # Créer un stand & conversation pour le test
    stand = Stand(id="test-stand-quota", salon_id="test-salon", exporter_id="test-exporter-co", company_name="Co", status="VALIDE")
    db.add(stand)
    conv = Conversation(id="test-conv-quota", importer_id="test-importer-co", stand_id="test-stand-quota")
    db.add(conv)
    db.commit()

    # Tenter d'envoyer un message
    response = client.post(
        "/conversations/test-conv-quota/messages",
        headers={"Authorization": f"Bearer {importer_token}"},
        json={"content": "Ceci devrait être bloqué par la limite de quota."}
    )
    assert response.status_code == 402
    detail = response.json()["detail"]
    detail_str = str(detail).lower()
    assert "quota" in detail_str or "limite" in detail_str or "50" in detail_str


# ─── Compléments de couverture ───────────────────────────────────────────────
def test_list_conversations_importer(client: TestClient, importer_token: str, db):
    _seed_stand_and_conv(db)
    resp = client.get("/conversations/", headers=_auth(importer_token))
    assert resp.status_code == 200
    ids = [c["id"] for c in resp.json()]
    assert "test-conv-msg2" in ids


def test_get_conversation_marks_consulted(client: TestClient, importer_token: str, db):
    _, conv = _seed_stand_and_conv(db)
    resp = client.get(f"/conversations/{conv.id}", headers=_auth(importer_token))
    assert resp.status_code == 200
    assert resp.json()["status"] == "CONSULTEE"


def test_get_conversation_404(client: TestClient, importer_token: str):
    resp = client.get("/conversations/inexistante", headers=_auth(importer_token))
    assert resp.status_code == 404


def test_update_conversation_status(client: TestClient, exporter_token: str, db):
    _, conv = _seed_stand_and_conv(db)
    resp = client.patch(
        f"/conversations/{conv.id}/status",
        headers=_auth(exporter_token),
        json={"status": "EN_NEGOCIATION"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "EN_NEGOCIATION"


def test_update_conversation_status_invalid(client: TestClient, exporter_token: str, db):
    _, conv = _seed_stand_and_conv(db)
    resp = client.patch(
        f"/conversations/{conv.id}/status",
        headers=_auth(exporter_token),
        json={"status": "STATUT_INCONNU"},
    )
    assert resp.status_code == 400


def test_update_conversation_status_forbidden_for_importer(client: TestClient, importer_token: str, db):
    _, conv = _seed_stand_and_conv(db)
    resp = client.patch(
        f"/conversations/{conv.id}/status",
        headers=_auth(importer_token),
        json={"status": "EN_CONTACT"},
    )
    assert resp.status_code == 403


def test_send_message_increments_quota(client: TestClient, importer_token: str, db):
    _, conv = _seed_stand_and_conv(db)
    resp = client.post(
        f"/conversations/{conv.id}/messages",
        headers=_auth(importer_token),
        json={"content": "Bonjour"},
    )
    assert resp.status_code == 201
    assert resp.json()["content"] == "Bonjour"
    quota = db.query(UserQuota).filter(UserQuota.user_id == "test-importer-user").first()
    assert quota.chats_used == 1


def test_send_message_empty_content(client: TestClient, importer_token: str, db):
    _, conv = _seed_stand_and_conv(db)
    resp = client.post(
        f"/conversations/{conv.id}/messages",
        headers=_auth(importer_token),
        json={"content": ""},
    )
    assert resp.status_code == 400


def test_send_message_conversation_404(client: TestClient, importer_token: str):
    resp = client.post(
        "/conversations/inexistante/messages",
        headers=_auth(importer_token),
        json={"content": "hi"},
    )
    assert resp.status_code == 404


def test_send_message_abonne_passes_quota(client: TestClient, importer_token: str, db):
    quota = db.query(UserQuota).filter(UserQuota.user_id == "test-importer-user").first()
    if not quota:
        quota = UserQuota(user_id="test-importer-user")
        db.add(quota)
    quota.status = "ABONNE"
    quota.chats_used = 50
    db.commit()

    _, conv = _seed_stand_and_conv(db)
    resp = client.post(
        f"/conversations/{conv.id}/messages",
        headers=_auth(importer_token),
        json={"content": "Message illimité"},
    )
    assert resp.status_code == 201


def test_list_messages(client: TestClient, importer_token: str, db):
    _, conv = _seed_stand_and_conv(db)
    client.post(
        f"/conversations/{conv.id}/messages",
        headers=_auth(importer_token),
        json={"content": "Premier message"},
    )
    resp = client.get(f"/conversations/{conv.id}/messages", headers=_auth(importer_token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["content"] == "Premier message"


def test_upload_conversation_document(client: TestClient, importer_token: str, db):
    _, conv = _seed_stand_and_conv(db)
    files = {"file": ("contrat.pdf", b"%PDF-1.4 data", "application/pdf")}
    resp = client.post(
        f"/conversations/{conv.id}/documents",
        headers=_auth(importer_token),
        files=files,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["document_url"].startswith("/static/uploads/")
    assert data["document_name"] == "contrat.pdf"


def test_create_conversation_stand_not_validated(client: TestClient, importer_token: str, db):
    stand = Stand(
        id="test-stand-nonvalide",
        salon_id="test-salon",
        exporter_id="test-exporter-co",
        company_name="Stand Non Validé",
        status="EN_ATTENTE_VALIDATION",
    )
    db.add(stand)
    db.commit()

    resp = client.post(
        "/conversations/",
        headers=_auth(importer_token),
        json={"importer_id": "test-importer-co", "stand_id": "test-stand-nonvalide"},
    )
    assert resp.status_code == 400


def test_create_conversation_stand_404(client: TestClient, importer_token: str):
    resp = client.post(
        "/conversations/",
        headers=_auth(importer_token),
        json={"importer_id": "test-importer-co", "stand_id": "inexistant"},
    )
    assert resp.status_code == 404
