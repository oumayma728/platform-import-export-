"""
email.py — Service d'envoi d'emails (SMTP)
Utilisé pour les notifications : inscription, RDV, paiement, quota...
"""
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@salonsvirtuels.com")


def _is_email_configured() -> bool:
    return bool(SMTP_USER and SMTP_PASSWORD)


def send_email(to: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    """
    Envoie un email via SMTP.
    Retourne True si l'envoi réussit, False sinon.
    En mode développement (sans config SMTP), log l'email au lieu de l'envoyer.
    """
    if not _is_email_configured():
        logger.info(
            f"[EMAIL - DEV MODE] To: {to} | Subject: {subject}\n"
            f"Body preview: {(text_body or html_body)[:200]}..."
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = to

        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(EMAIL_FROM, [to], msg.as_string())

        logger.info(f"Email envoyé à {to} : {subject}")
        return True

    except Exception as e:
        logger.error(f"Erreur envoi email à {to} : {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Templates d'emails
# ─────────────────────────────────────────────────────────────────────────────
def welcome_email_html(full_name: str) -> str:
    """Corps HTML de l'email de bienvenue après inscription."""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Bienvenue, {full_name or 'nouveau membre'} !</h1>
        <p>Votre compte a été créé avec succès sur la plateforme <strong>Salons Virtuels</strong>.</p>
        <p>Votre compte est en attente de validation par notre équipe. Vous recevrez un email dès que votre compte sera activé.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Salons Virtuels — Plateforme de commerce international</p>
    </div>
    """


def new_message_email_html(sender_name: str, conversation_id: str) -> str:
    """Corps HTML de la notification de nouveau message."""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Nouveau message</h2>
        <p>Vous avez reçu un nouveau message de <strong>{sender_name}</strong>.</p>
        <p><a href="http://localhost:5173/conversations/{conversation_id}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Voir le message</a></p>
    </div>
    """


def payment_confirmed_email_html(company_name: str, amount: float) -> str:
    """Corps HTML de la notification de paiement confirmé."""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Paiement reçu</h2>
        <p>Le paiement de <strong>{amount:.2f} €</strong> pour le stand de <strong>{company_name}</strong> a été confirmé.</p>
        <p>Votre stand est maintenant en cours de validation par notre équipe.</p>
    </div>
    """


def quota_exceeded_email_html(full_name: str) -> str:
    """Corps HTML de l'alerte dépassement de quota de chats gratuits."""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Quota de messages atteint</h2>
        <p>Bonjour {full_name or ''},</p>
        <p>Vous avez utilisé vos <strong>50 messages gratuits</strong> sur la plateforme Salons Virtuels.</p>
        <p>Pour continuer à communiquer avec vos partenaires, souscrivez à un abonnement :</p>
        <ul>
            <li>📦 Pack 200 messages — 9,90 €</li>
            <li>♾️ Messages illimités — 29 €/mois</li>
        </ul>
        <p><a href="http://localhost:5173/subscription" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Choisir un abonnement</a></p>
    </div>
    """


def send_welcome_email(to: str, full_name: str) -> bool:
    """Email de bienvenue après inscription."""
    return send_email(
        to=to,
        subject="Bienvenue sur Salons Virtuels",
        html_body=welcome_email_html(full_name),
        text_body=f"Bienvenue {full_name or ''} ! Votre compte est en attente de validation.",
    )


def send_account_validated_email(to: str, full_name: str) -> bool:
    """Email de validation de compte par l'admin."""
    return send_email(
        to=to,
        subject="✅ Votre compte Salons Virtuels est validé",
        html_body=f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e;">Compte activé !</h1>
            <p>Bonjour {full_name or ''},</p>
            <p>Votre compte sur <strong>Salons Virtuels</strong> vient d'être validé. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.</p>
            <p><a href="http://localhost:5173" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accéder à la plateforme</a></p>
            <hr>
            <p style="color: #666; font-size: 12px;">Salons Virtuels — Plateforme de commerce international</p>
        </div>
        """,
    )


def send_new_message_email(to: str, sender_name: str, conversation_id: str) -> bool:
    """Notification de nouveau message."""
    return send_email(
        to=to,
        subject=f"💬 Nouveau message de {sender_name}",
        html_body=new_message_email_html(sender_name, conversation_id),
    )


def send_rdv_proposed_email(to: str, proposed_datetime: str, exporter_name: str) -> bool:
    """Notification de rendez-vous proposé."""
    return send_email(
        to=to,
        subject="📅 Nouveau rendez-vous proposé",
        html_body=f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">Rendez-vous proposé</h2>
            <p>Un rendez-vous a été proposé avec <strong>{exporter_name}</strong>.</p>
            <p><strong>Date proposée :</strong> {proposed_datetime}</p>
            <p>Connectez-vous pour confirmer ou refuser ce rendez-vous.</p>
        </div>
        """,
    )


def send_rdv_confirmed_email(to: str, proposed_datetime: str) -> bool:
    """Notification de rendez-vous confirmé."""
    return send_email(
        to=to,
        subject="✅ Rendez-vous confirmé",
        html_body=f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">Rendez-vous confirmé !</h2>
            <p>Votre rendez-vous du <strong>{proposed_datetime}</strong> a été confirmé.</p>
            <p>Bonne réunion !</p>
        </div>
        """,
    )


def salon_invitation_email_html(salon_title: str, salon_dates: str, company_name: str, category: Optional[str] = None) -> str:
    """Corps HTML de l'invitation d'un salon virtuel aux importateurs."""
    category_line = f"<p><strong>Catégorie :</strong> {category}</p>" if category else ""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Vous êtes invité au salon {salon_title}</h1>
        <p>Bonjour {company_name or ''},</p>
        <p>Le salon virtuel <strong>{salon_title}</strong> ({salon_dates}) ouvre bientôt ses portes.</p>
        {category_line}
        <p>Rencontrez en ligne des exportateurs du monde entier, découvrez leurs produits et planifiez des rendez-vous B2B.</p>
        <p><a href="http://localhost:5173/salons" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Découvrir le salon</a></p>
        <hr>
        <p style="color: #666; font-size: 12px;">Salons Virtuels — Plateforme de commerce international</p>
    </div>
    """


def send_salon_invitation_email(to: str, salon_title: str, salon_dates: str, company_name: str, category: Optional[str] = None) -> bool:
    """Invitation à un salon virtuel (destinataire : importateur)."""
    return send_email(
        to=to,
        subject=f"🎪 Invitation : {salon_title}",
        html_body=salon_invitation_email_html(salon_title, salon_dates, company_name, category),
        text_body=f"Bonjour {company_name or ''}, vous êtes invité au salon virtuel {salon_title} ({salon_dates}).",
    )


def rdv_reminder_email_html(exporter_name: str, proposed_datetime: str, rdv_id: str) -> str:
    """Corps HTML du rappel 24h avant un rendez-vous confirmé."""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Rappel : rendez-vous dans moins de 24h</h2>
        <p>Vous avez un rendez-vous avec <strong>{exporter_name}</strong>.</p>
        <p><strong>Date :</strong> {proposed_datetime}</p>
        <p><strong>Référence :</strong> #{rdv_id}</p>
        <p>Connectez-vous à temps pour ne pas manquer votre réunion B2B.</p>
        <p><a href="http://localhost:5173/rendez-vous" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Voir mon rendez-vous</a></p>
        <hr>
        <p style="color: #666; font-size: 12px;">Salons Virtuels — Plateforme de commerce international</p>
    </div>
    """


def send_rdv_reminder_email(to: str, exporter_name: str, proposed_datetime: str, rdv_id: str) -> bool:
    """Rappel automatique envoyé 24h avant un rendez-vous confirmé."""
    return send_email(
        to=to,
        subject=f"⏰ Rappel : rendez-vous {rdv_id} dans moins de 24h",
        html_body=rdv_reminder_email_html(exporter_name, proposed_datetime, rdv_id),
        text_body=f"Rappel : rendez-vous avec {exporter_name} le {proposed_datetime}.",
    )


def send_rdv_notification_email(to: str, rdv_id: str, status: str) -> bool:
    """Notification générique pour statut de rendez-vous."""
    return send_email(
        to=to,
        subject=f"📅 Mise à jour Rendez-vous #{rdv_id}",
        html_body=f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Statut de rendez-vous mis à jour</h2>
            <p>Le rendez-vous <strong>#{rdv_id}</strong> a changé de statut : <strong>{status}</strong>.</p>
        </div>
        """,
    )


def send_payment_confirmed_email(to: str, company_name: str, amount: float) -> bool:
    """Notification de paiement de stand confirmé."""
    return send_email(
        to=to,
        subject="💳 Paiement de stand confirmé",
        html_body=payment_confirmed_email_html(company_name, amount),
    )


def send_quota_exceeded_email(to: str, full_name: str) -> bool:
    """Alerte dépassement du quota de chats gratuits."""
    return send_email(
        to=to,
        subject="⚠️ Quota de messages gratuits atteint",
        html_body=quota_exceeded_email_html(full_name),
    )
