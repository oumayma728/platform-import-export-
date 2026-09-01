"""Tests unitaires isolés des services externes : chaque fonction est testée seule,
sans passer par l'API HTTP, avec les appels réseau réels remplacés par des mocks."""
import asyncio
from unittest.mock import patch, MagicMock
from app.services.email_service import send_email

# ---------------------------------------------------------------------------
# currency_service
# ---------------------------------------------------------------------------

def test_convert_meme_devise_ne_fait_aucun_appel_reseau():
    from app.services.currency_service import convert
    with patch("app.services.currency_service._fetch_rates") as mock_fetch:
        resultat = asyncio.run(convert(100, "USD", "usd"))
    mock_fetch.assert_not_called()
    assert resultat["converted_amount"] == 100
    assert resultat["rate"] == 1.0


def test_convert_devises_differentes_appelle_lapi():
    from app.services.currency_service import convert
    with patch("app.services.currency_service._fetch_rates", return_value={"EUR": 0.92}) as mock_fetch:
        resultat = asyncio.run(convert(100, "USD", "EUR"))
    mock_fetch.assert_called_once()
    assert resultat["converted_amount"] == 92.0
    assert resultat["rate"] == 0.92


def test_convert_devise_cible_absente_leve_value_error():
    from app.services.currency_service import convert
    from unittest.mock import patch
    import asyncio
    import pytest

    with patch(
        "app.services.currency_service._fetch_rates",
        return_value={"GBP": 0.8},
    ):
        with pytest.raises(ValueError):
            asyncio.run(convert(100, "USD", "EUR"))
# ---------------------------------------------------------------------------
# logistics_service
# ---------------------------------------------------------------------------

def test_estimate_calcule_bien_la_distance():
    from app.services.logistics_service import estimate
    with patch(
        "app.services.logistics_service._fetch_country_coords",
        side_effect=lambda code: {"FR": (46.0, 2.0), "TN": (34.0, 9.0)}[code],
    ):
        resultat = asyncio.run(estimate("TN", "FR"))
    assert resultat["distance_km"] > 0
    assert resultat["estimated_cost_usd"] > 0
    assert resultat["estimated_days"] >= 1


def test_estimate_pays_inconnu_leve_value_error():
    from app.services.logistics_service import _fetch_country_coords
    try:
        _fetch_country_coords("ZZ")
        assert False, "aurait dû lever ValueError"
    except ValueError as e:
        assert "inconnu" in str(e).lower()


def test_estimate_utilise_le_cache_au_deuxieme_appel():
    from app.services.logistics_service import estimate, _coords_cache
    _coords_cache.clear()
    appels = {"count": 0}

    def fake_fetch(code):
        appels["count"] += 1
        return {"FR": (46.0, 2.0), "TN": (34.0, 9.0)}[code]

    with patch("app.services.logistics_service._fetch_country_coords", side_effect=fake_fetch):
        asyncio.run(estimate("TN", "FR"))
        asyncio.run(estimate("TN", "FR"))

    # 2 pays x 1er appel = 2 ; le 2e estimate() ne doit rien re-fetcher grâce au cache
    assert appels["count"] == 2


# ---------------------------------------------------------------------------
# email_service / sms_service
# ---------------------------------------------------------------------------




from unittest.mock import patch

def test_send_email_gmail():
    import os
    from app.services.email_service import send_email

    os.environ["GMAIL_ADDRESS"] = "test@gmail.com"
    os.environ["GMAIL_APP_PASSWORD"] = "fakepassword"

    with patch("smtplib.SMTP_SSL") as smtp:

        server = smtp.return_value.__enter__.return_value

        result = send_email(
            "client@test.com",
            "Sujet",
            "Message"
        )

        server.login.assert_called_once()
        server.sendmail.assert_called_once()

        assert result["message"] == "Email envoyé"


def test_send_sms_appelle_twilio(mock_twilio):
    import os
    os.environ["TWILIO_ACCOUNT_SID"] = "AC_fake"
    os.environ["TWILIO_AUTH_TOKEN"] = "fake_token"
    os.environ["TWILIO_PHONE_NUMBER"] = "+15005550006"
    from app.services import sms_service
    sms_service.send_sms("+21600000000", "Message de test")
    mock_twilio.messages.create.assert_called_once()