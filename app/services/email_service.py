import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
):
    smtp_host = os.getenv("SMTP_HOST") or os.getenv("EMAIL_SMTP_HOST") or "smtp.gmail.com"
    smtp_port = int(os.getenv("SMTP_PORT", "587"))

    smtp_user = os.getenv("SMTP_USER") or os.getenv("GMAIL_ADDRESS")
    smtp_password = os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or os.getenv("GMAIL_ADDRESS")

    if not smtp_user:
        raise RuntimeError("SMTP_USER / GMAIL_ADDRESS non configuré dans .env")

    if not smtp_password:
        raise RuntimeError("SMTP_PASSWORD / GMAIL_APP_PASSWORD non configuré dans .env")

    if not smtp_from:
        raise RuntimeError("SMTP_FROM / GMAIL_ADDRESS non configuré dans .env")

    message = MIMEMultipart("alternative")

    message["Subject"] = subject
    message["From"] = smtp_from
    message["To"] = to_email

    html_part = MIMEText(
        html_content,
        "html",
        "utf-8",
    )

    message.attach(html_part)

    try:
        # Brevo : STARTTLS sur le port 587
        with smtplib.SMTP(
            smtp_host,
            smtp_port,
            timeout=30,
        ) as server:

            server.ehlo()

            server.starttls()

            server.ehlo()

            server.login(
                smtp_user,
                smtp_password,
            )

            server.sendmail(
                smtp_from,
                [to_email],
                message.as_string(),
            )

        return True

    except Exception as exc:
        print(
            "[EMAIL] Erreur d'envoi :",
            repr(exc),
        )

        raise