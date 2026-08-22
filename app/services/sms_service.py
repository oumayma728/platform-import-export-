import os
from twilio.rest import Client


def send_sms(to_phone: str, message: str):
    try:
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_phone = os.getenv("TWILIO_PHONE_NUMBER")

        if not account_sid or not auth_token or not from_phone:
            return {"error": "Twilio n'est pas configuré correctement"}

        if to_phone == from_phone:
            return {"error": "Le numéro destinataire ne peut pas être identique au numéro expéditeur."}

        client = Client(account_sid, auth_token)
        client.messages.create(
            body=message,
            from_=from_phone,
            to=to_phone
        )
        return {"message": "SMS envoyé"}
    except Exception as e:
        return {"error": str(e)}