"""
sms.py — Service d'envoi de SMS (Twilio)
"""
import logging
import os

try:
    from twilio.rest import Client
    from twilio.base.exceptions import TwilioRestException
    HAS_TWILIO = True
except ImportError:
    Client = None
    TwilioRestException = Exception
    HAS_TWILIO = False

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")

_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        _client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("📱 Service SMS (Twilio) configuré avec succès.")
    except Exception as e:
        logger.error(f"❌ Erreur d'initialisation de Twilio: {e}")
else:
    logger.warning("⚠️ Credentials Twilio manquants. Les SMS seront uniquement journalisés (log).")


def send_sms(to_number: str, message: str) -> bool:
    """
    Envoie un SMS via Twilio.
    Si les credentials ne sont pas configurés, log simplement le message (Mode Simulation).
    """
    if not to_number:
        logger.error("❌ Numéro de téléphone manquant pour l'envoi de SMS.")
        return False

    if _client and TWILIO_FROM_NUMBER:
        try:
            msg = _client.messages.create(
                body=message,
                from_=TWILIO_FROM_NUMBER,
                to=to_number
            )
            logger.info(f"📱 SMS envoyé à {to_number} (SID: {msg.sid})")
            return True
        except TwilioRestException as e:
            logger.error(f"❌ Erreur lors de l'envoi du SMS via Twilio: {e}")
            return False
    else:
        # Mode Simulation (Fallback)
        logger.info(f"📱 [SIMULATION SMS] À destination de {to_number} :\n{message}")
        return True
