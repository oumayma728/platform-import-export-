import os
from twilio.rest import Client

def send_sms(to_phone: str, message: str):
    try:
        client = Client(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN")
        )
        client.messages.create(
            body=message,
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=to_phone
        )
        return {"message": "SMS envoyé"}
    except Exception as e:
        return {"error": str(e)}