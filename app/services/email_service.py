import os
import smtplib
from email.mime.text import MIMEText

def send_email(to_email: str, subject: str, content: str):
    msg = MIMEText(content, "html")
    msg["Subject"] = subject
    msg["From"] = os.getenv("GMAIL_ADDRESS")
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(os.getenv("GMAIL_ADDRESS"), os.getenv("GMAIL_APP_PASSWORD"))
            server.sendmail(os.getenv("GMAIL_ADDRESS"), to_email, msg.as_string())
        return {"message": "Email envoyé"}
    except Exception as e:
        return {"error": str(e)}