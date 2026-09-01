"""
test_reminders.py — Tests du job de rappels 24h + nouveaux templates email
"""
from datetime import datetime, timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.models import NotificationLog, RendezVous
from app.services.reminders import run_rdv_reminders
from app.services.email import (
    rdv_reminder_email_html,
    salon_invitation_email_html,
    send_rdv_reminder_email,
    send_salon_invitation_email,
)


def _add_rdv(db, rdv_id: str, dt: str, status: str = "CONFIRME") -> RendezVous:
    rdv = RendezVous(
        id=rdv_id,
        salon_id="test-salon",
        exporter_id="test-exporter-co",
        importer_id="test-importer-co",
        proposed_datetime=dt,
        status=status,
    )
    db.add(rdv)
    db.commit()
    return rdv


# ─── Job de rappels 24h ──────────────────────────────────────────────────────
def test_reminders_sends_for_confirmed_within_24h(db):
    dt = (datetime.utcnow() + timedelta(hours=6)).isoformat()
    _add_rdv(db, "test-rdv-remind-1", dt)

    with patch("app.services.reminders.NotificationService.send_email", return_value=True) as mock_email:
        sent = run_rdv_reminders(db=db)

    assert sent == 2  # exportateur + importateur
    assert mock_email.call_count == 2


def test_reminders_skips_rdv_outside_window(db):
    dt = (datetime.utcnow() + timedelta(hours=48)).isoformat()
    _add_rdv(db, "test-rdv-remind-2", dt)

    with patch("app.services.reminders.NotificationService.send_email", return_value=True) as mock_email:
        sent = run_rdv_reminders(db=db)

    assert sent == 0
    mock_email.assert_not_called()


def test_reminders_skips_past_rdv(db):
    dt = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    _add_rdv(db, "test-rdv-remind-3", dt)

    with patch("app.services.reminders.NotificationService.send_email", return_value=True) as mock_email:
        sent = run_rdv_reminders(db=db)

    assert sent == 0


def test_reminders_skips_non_confirmed(db):
    dt = (datetime.utcnow() + timedelta(hours=6)).isoformat()
    _add_rdv(db, "test-rdv-remind-4", dt, status="PROPOSE")

    with patch("app.services.reminders.NotificationService.send_email", return_value=True) as mock_email:
        sent = run_rdv_reminders(db=db)

    assert sent == 0


def test_reminders_idempotent(db):
    dt = (datetime.utcnow() + timedelta(hours=6)).isoformat()
    _add_rdv(db, "test-rdv-remind-5", dt)

    # Un rappel a déjà été envoyé à l'exportateur
    db.add(
        NotificationLog(
            user_id="test-exporter-user",
            channel="EMAIL",
            recipient="exporter@test.com",
            subject="⏰ Rappel : rendez-vous test-rdv-remind-5 dans moins de 24h",
            content="déjà envoyé",
            status="SENT",
            retries=0,
        )
    )
    db.commit()

    with patch("app.services.reminders.NotificationService.send_email", return_value=True) as mock_email:
        sent = run_rdv_reminders(db=db)

    assert sent == 1  # seul l'importateur n'a pas encore été notifié
    mock_email.assert_called_once()


def test_reminders_skips_invalid_datetime(db):
    _add_rdv(db, "test-rdv-remind-6", "pas-une-date")

    with patch("app.services.reminders.NotificationService.send_email", return_value=True) as mock_email:
        sent = run_rdv_reminders(db=db)

    assert sent == 0
    mock_email.assert_not_called()


def test_reminders_without_db_opens_session():
    """Appel sans session fournie → ouvre une SessionLocal (fermée ensuite)."""
    with patch("app.services.reminders.NotificationService.send_email", return_value=True):
        sent = run_rdv_reminders(db=None)
    assert sent == 0


# ─── Nouveaux templates email ────────────────────────────────────────────────
def test_salon_invitation_html_contains_title():
    html = salon_invitation_email_html("Salon Agro 2027", "2027-09-01 → 2027-09-03", "Import Co")
    assert "Salon Agro 2027" in html
    assert "Import Co" in html


def test_rdv_reminder_html_contains_details():
    html = rdv_reminder_email_html("Export Co", "2027-09-02T10:00:00", "rdv-xyz")
    assert "Export Co" in html
    assert "rdv-xyz" in html


def test_send_salon_invitation_dev_mode():
    # Mode dev (SMTP non configuré) → log + True
    ok = send_salon_invitation_email("imp@test.com", "Salon", "dates", "Co")
    assert ok is True


def test_send_rdv_reminder_dev_mode():
    ok = send_rdv_reminder_email("exp@test.com", "Export Co", "2027-09-02T10:00:00", "rdv-abc")
    assert ok is True


# ─── Trigger HTTP : publication salon → invitation importateurs ──────────────
def test_publish_salon_invites_importers(client: TestClient, admin_token: str):
    with patch("app.routes.salons.send_salon_invitation_email") as mock_invite:
        resp = client.patch(
            "/salons/test-salon/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "PUBLIE"},
        )
    assert resp.status_code == 200
    assert resp.json()["status"] == "PUBLIE"
    mock_invite.assert_called_once()
    assert mock_invite.call_args.kwargs["to"] == "importer@test.com"
    assert mock_invite.call_args.kwargs["salon_title"] == "Salon Test"


def test_unpublish_salon_no_invitation(client: TestClient, admin_token: str):
    with patch("app.routes.salons.send_salon_invitation_email") as mock_invite:
        resp = client.patch(
            "/salons/test-salon/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "CLOTURE"},
        )
    assert resp.status_code == 200
    mock_invite.assert_not_called()
