"""
Tests pour le mécanisme de retry des notifications (app/services/notification_service.py)
"""
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest

from app.models.notification import NotificationLog
from app.services.notification_service import (
    create_notification,
    retry_failed_notifications,
    MAX_TENTATIVES,
)


def _make_failed_notification(db, canal="EMAIL", destinataire="fail@example.com", tentatives=0, derniere_tentative=None):
    notif = NotificationLog(
        user_id=None,
        canal=canal,
        destinataire=destinataire,
        sujet="Test",
        contenu="Contenu de test",
        statut="ECHEC",
        tentatives=tentatives,
        derniere_tentative=derniere_tentative,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


class TestRetryFailedNotifications:

    def test_retry_reussi_passe_en_envoyee(self, db_session):
        """Une notification en échec, retentée avec succès, doit passer à ENVOYEE."""
        notif = _make_failed_notification(db_session)

        with patch("app.services.notification_service._send_email_notification") as mock_send:
            mock_send.return_value = None  # simulate success
            resultats = retry_failed_notifications(db_session)

        db_session.refresh(notif)
        assert notif.statut == "ENVOYEE"
        assert notif.tentatives == 1
        assert resultats["reussies"] == 1
        assert resultats["retentees"] == 1

    def test_retry_echoue_incremente_tentatives(self, db_session):
        """Un retry qui échoue encore doit incrémenter le compteur sans passer en définitif avant 3 essais."""
        notif = _make_failed_notification(db_session, tentatives=1)

        with patch("app.services.notification_service._send_email_notification") as mock_send:
            mock_send.side_effect = Exception("SMTP error")
            retry_failed_notifications(db_session)

        db_session.refresh(notif)
        assert notif.statut == "ECHEC"
        assert notif.tentatives == 2

    def test_echec_definitif_apres_max_tentatives(self, db_session):
        """Après MAX_TENTATIVES échecs, le statut doit passer à ECHEC_DEFINITIF."""
        notif = _make_failed_notification(db_session, tentatives=MAX_TENTATIVES - 1)

        with patch("app.services.notification_service._send_email_notification") as mock_send:
            mock_send.side_effect = Exception("SMTP error")
            resultats = retry_failed_notifications(db_session)

        db_session.refresh(notif)
        assert notif.statut == "ECHEC_DEFINITIF"
        assert notif.tentatives == MAX_TENTATIVES
        assert resultats["definitivement_echouees"] == 1

    def test_notification_definitivement_echouee_nest_plus_retentee(self, db_session):
        """Une notification déjà à MAX_TENTATIVES ne doit plus être reprise par le retry."""
        notif = _make_failed_notification(db_session, tentatives=MAX_TENTATIVES)

        resultats = retry_failed_notifications(db_session)

        assert resultats["retentees"] == 0
        db_session.refresh(notif)
        assert notif.tentatives == MAX_TENTATIVES  # inchangé

    def test_respecte_le_delai_entre_tentatives(self, db_session):
        """Une notification retentée trop récemment ne doit pas être reprise avant le délai."""
        notif = _make_failed_notification(
            db_session, tentatives=1, derniere_tentative=datetime.utcnow()
        )

        resultats = retry_failed_notifications(db_session)

        assert resultats["retentees"] == 0
        db_session.refresh(notif)
        assert notif.tentatives == 1  # inchangé, trop tôt pour retenter

    def test_notification_envoyee_nest_pas_concernee(self, db_session):
        """Une notification déjà ENVOYEE ne doit jamais apparaître dans le retry."""
        notif = NotificationLog(
            canal="EMAIL", destinataire="ok@example.com", statut="ENVOYEE", tentatives=0,
        )
        db_session.add(notif)
        db_session.commit()

        resultats = retry_failed_notifications(db_session)

        assert resultats["retentees"] == 0