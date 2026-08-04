"""Tests du module notifications : creation, liste, marquage lu/non lu."""


def test_send_email_notification_cree_une_entree(client, registered_user, mock_email):
    r = client.post("/api/notifications/email", params={
        "to": "destinataire@example.com", "subject": "Test", "body": "Contenu du message",
    }, headers=registered_user["headers"])
    assert r.status_code == 200


def test_send_sms_notification_cree_une_entree(client, registered_user, mock_twilio):
    r = client.post("/api/notifications/sms", params={
        "to": "+21600000000", "message": "Test SMS",
    }, headers=registered_user["headers"])
    assert r.status_code == 200


def test_lister_mes_notifications(client, registered_user, mock_email):
    client.post("/api/notifications/email", params={
        "to": "x@example.com", "subject": "Notif 1", "body": "Contenu",
    }, headers=registered_user["headers"])

    r = client.get("/api/notifications/me", headers=registered_user["headers"])
    assert r.status_code == 200
    assert len(r.json()) >= 1
    assert all("lu" in n for n in r.json())


def test_marquer_notification_comme_lue(client, registered_user, mock_email):
    r = client.post("/api/notifications/email", params={
        "to": "x@example.com", "subject": "A lire", "body": "Contenu",
    }, headers=registered_user["headers"])
    notification_id = r.json()["id"]

    r2 = client.patch(f"/api/notifications/{notification_id}/read", headers=registered_user["headers"])
    assert r2.status_code == 200
    assert r2.json()["lu"] is True


def test_filtre_non_lues_exclut_les_notifications_lues(client, registered_user, mock_email):
    r1 = client.post("/api/notifications/email", params={
        "to": "x@example.com", "subject": "Non lue", "body": "Contenu",
    }, headers=registered_user["headers"])
    r2 = client.post("/api/notifications/email", params={
        "to": "x@example.com", "subject": "Sera lue", "body": "Contenu",
    }, headers=registered_user["headers"])
    client.patch(f"/api/notifications/{r2.json()['id']}/read", headers=registered_user["headers"])

    r3 = client.get("/api/notifications/me", params={"non_lues": True}, headers=registered_user["headers"])
    sujets = [n["sujet"] for n in r3.json()]
    assert "Non lue" in sujets
    assert "Sera lue" not in sujets


def test_marquer_notification_dun_autre_utilisateur_refuse(client, registered_user, second_user, mock_email):
    r = client.post("/api/notifications/email", params={
        "to": "x@example.com", "subject": "Privee", "body": "Contenu",
    }, headers=registered_user["headers"])
    notification_id = r.json()["id"]

    r2 = client.patch(f"/api/notifications/{notification_id}/read", headers=second_user["headers"])
    assert r2.status_code == 404


def test_notifications_necessite_authentification(client):
    r = client.get("/api/notifications/me")
    assert r.status_code == 401