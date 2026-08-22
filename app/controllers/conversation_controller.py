from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.listing import Listing
from app.models.billing import UserQuota
from app.models.conversations import (
    Conversation,
    Message,
    CONVERSATION_STATUSES,
)
from app.models.user import User
from app.services.notification_service import create_notification


# ---------------------------------------------------------------------------
# Mappings Frontend <-> Backend
# ---------------------------------------------------------------------------

STATUS_TO_FRONT = {
    "SUGGEREE": "suggested",
    "CONSULTEE": "consulted",
    "EN_CONTACT": "in_contact",
    "EN_NEGOCIATION": "negotiating",
    "CONCLUE": "concluded",
    "REJETEE": "rejected",
}

ROLE_TO_FRONT = {
    "EXPORTATEUR": "exporter",
    "IMPORTATEUR": "importer",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def is_member(conversation: Conversation, user_id: int):
    """
    Vérifie que l'utilisateur appartient bien à la conversation.
    """
    if user_id not in (
        conversation.initiateur_id,
        conversation.destinataire_id,
    ):
        raise HTTPException(
            status_code=403,
            detail="Vous ne faites pas partie de cette conversation",
        )


def get_other_user(
    conversation: Conversation,
    current_user_id: int,
    db: Session,
):
    """
    Retourne l'autre participant de la conversation.
    """
    other_user_id = (
        conversation.destinataire_id
        if conversation.initiateur_id == current_user_id
        else conversation.initiateur_id
    )

    return db.get(User, other_user_id)


def serialize_message(message: Message):
    """
    Format commun d'un message pour le frontend.
    On conserve aussi les anciens noms backend pour compatibilité.
    """
    return {
        # Format backend historique
        "id": message.id,
        "conversation_id": message.conversation_id,
        "expediteur_id": message.expediteur_id,
        "contenu": message.contenu,
        "document_url": message.document_url,
        "created_at": message.created_at,
        "lu": message.lu,

        # Alias frontend
        "conversationId": message.conversation_id,
        "senderId": message.expediteur_id,
        "text": message.contenu,
        "documentUrl": message.document_url,
        "createdAt": message.created_at,
        "sentAt": message.created_at,
    }


def conversation_dict(
    item: Conversation,
    current_user_id: int,
    db: Session,
):
    """
    Sérialise une conversation dans un format compatible avec :
    - l'ancien backend
    - le frontend actuel

    Retourne notamment :
    listingId
    listingProduct
    status
    counterpart
    messages
    """

    other_user = get_other_user(
        item,
        current_user_id,
        db,
    )

    listing = None

    if item.listing_id is not None:
        listing = db.get(
            Listing,
            item.listing_id,
        )

    messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == item.id
        )
        .order_by(
            Message.created_at.asc()
        )
        .all()
    )

    # Nom affiché pour le participant
    if other_user:
        counterpart_name = (
            other_user.entreprise
            or other_user.nom
        )
    else:
        counterpart_name = None

    # Rôle du participant
    counterpart_role = None

    if other_user:
        raw_role = getattr(
            other_user,
            "type_compte",
            None,
        )

        if raw_role:
            raw_role = str(raw_role).upper()

            # Cas éventuel où plusieurs rôles auraient été stockés
            # dans une liste/JSON.
            if isinstance(raw_role, str) and "," in raw_role:
                first_role = raw_role.split(",")[0].strip()
                counterpart_role = ROLE_TO_FRONT.get(
                    first_role,
                    first_role.lower(),
                )
            else:
                counterpart_role = ROLE_TO_FRONT.get(
                    raw_role,
                    raw_role.lower(),
                )

    return {
        # ------------------------------------------------------------------
        # Backend historique
        # ------------------------------------------------------------------
        "id": item.id,
        "initiateur_id": item.initiateur_id,
        "destinataire_id": item.destinataire_id,
        "listing_id": item.listing_id,
        "statut": item.statut,

        # ------------------------------------------------------------------
        # Frontend
        # ------------------------------------------------------------------
        "listingId": item.listing_id,

        "listingProduct": (
            getattr(listing, "titre", None)
            if listing
            else None
        ),

        "status": STATUS_TO_FRONT.get(
            str(item.statut),
            str(item.statut).lower(),
        ),

        "counterpart": {
            "ownerId": (
                other_user.id
                if other_user
                else None
            ),
            "name": counterpart_name,
            "country": (
                other_user.pays
                if other_user
                else None
            ),
            "role": counterpart_role,
        },

        "messages": [
            serialize_message(message)
            for message in messages
        ],

        # Dates
        "created_at": (
            item.created_at
            if item.created_at
            else None
        ),
        "updated_at": (
            item.updated_at
            if item.updated_at
            else None
        ),

        "createdAt": (
            item.created_at
            if item.created_at
            else None
        ),
        "updatedAt": (
            item.updated_at
            if item.updated_at
            else None
        ),
    }


# ---------------------------------------------------------------------------
# Création de conversation
# ---------------------------------------------------------------------------

def create_conversation(
    destinataire_id: int,
    listing_id: int | None,
    user_id: int,
    db: Session,
):
    """
    Crée une nouvelle conversation.

    Important :
    - une conversation existante ne consomme PAS de quota ;
    - une nouvelle conversation consomme 1 chat ;
    - la 51e nouvelle conversation est bloquée selon le quota ;
    """

    if destinataire_id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Impossible de créer une conversation avec soi-même",
        )

    # -----------------------------------------------------------------------
    # 1. Chercher d'abord une conversation existante
    # -----------------------------------------------------------------------

    existing = (
        db.query(Conversation)
        .filter(
            Conversation.initiateur_id == user_id,
            Conversation.destinataire_id == destinataire_id,
            Conversation.listing_id == listing_id,
        )
        .first()
    )

    if existing:
        # Réouverture : aucune consommation supplémentaire
        return conversation_dict(
            existing,
            user_id,
            db,
        )

    # -----------------------------------------------------------------------
    # 2. Vérifier le quota uniquement pour un NOUVEAU chat
    # -----------------------------------------------------------------------

    quota = (
        db.query(UserQuota)
        .filter(
            UserQuota.user_id == user_id
        )
        .first()
    )

    if not quota:
        quota = UserQuota(
            user_id=user_id
        )
        db.add(quota)
        db.flush()

    chats_gratuits = quota.chats_gratuits or 50
    chats_utilises = quota.chats_utilises or 0

    # Statuts autorisant le dépassement de quota
    statuts_payants = {
        "ABONNE",
        "PAIEMENT_USAGE",
    }

    if (
        quota.statut not in statuts_payants
        and chats_utilises >= chats_gratuits
    ):
        quota.statut = "LIMITE_ATTEINTE"
        db.commit()

        emetteur = db.get(
            User,
            user_id,
        )

        if emetteur:
            try:
                create_notification(
                    db,
                    user_id,
                    "EMAIL",
                    emetteur.email,
                    (
                        "Vous avez atteint votre limite de "
                        "50 chats gratuits. Passez à "
                        "l'abonnement ou au paiement à l'usage "
                        "pour continuer."
                    ),
                    sujet="Limite de chats gratuits atteinte",
                )
            except Exception:
                # Une erreur de notification ne doit pas empêcher
                # le refus du nouveau chat.
                pass

        raise HTTPException(
            status_code=402,
            detail=(
                "Limite de 50 nouveaux chats atteinte. "
                "Un paiement ou abonnement est requis."
            ),
        )

    # -----------------------------------------------------------------------
    # 3. Création
    # -----------------------------------------------------------------------

    conversation = Conversation(
        initiateur_id=user_id,
        destinataire_id=destinataire_id,
        listing_id=listing_id,
    )

    quota.chats_utilises = chats_utilises + 1

    if quota.chats_utilises >= chats_gratuits:
        quota.statut = "LIMITE_ATTEINTE"

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation_dict(
        conversation,
        user_id,
        db,
    )


# ---------------------------------------------------------------------------
# Liste des conversations
# ---------------------------------------------------------------------------

def list_conversations(
    user_id: int,
    db: Session,
):
    """
    Retourne toutes les conversations auxquelles l'utilisateur participe.
    """

    rows = (
        db.query(Conversation)
        .filter(
            or_(
                Conversation.initiateur_id == user_id,
                Conversation.destinataire_id == user_id,
            )
        )
        .order_by(
            Conversation.updated_at.desc()
        )
        .all()
    )

    return [
        conversation_dict(
            row,
            user_id,
            db,
        )
        for row in rows
    ]


# ---------------------------------------------------------------------------
# Récupération d'une conversation
# ---------------------------------------------------------------------------

def get_conversation(
    conversation_id: int,
    user_id: int,
    db: Session,
):
    item = db.get(
        Conversation,
        conversation_id,
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Conversation introuvable",
        )

    is_member(
        item,
        user_id,
    )

    return item


# ---------------------------------------------------------------------------
# Ajouter un message
# ---------------------------------------------------------------------------

def add_message(
    conversation_id: int,
    user_id: int,
    contenu: str | None,
    document_url: str | None,
    db: Session,
):
    conversation = get_conversation(
        conversation_id,
        user_id,
        db,
    )

    if not contenu and not document_url:
        raise HTTPException(
            status_code=400,
            detail="Un message ou document est requis",
        )

    # Nettoyage du texte
    if contenu is not None:
        contenu = contenu.strip()

        if not contenu and not document_url:
            raise HTTPException(
                status_code=400,
                detail="Le message ne peut pas être vide",
            )

    # -----------------------------------------------------------------------
    # Création du message
    # -----------------------------------------------------------------------

    msg = Message(
        conversation_id=conversation.id,
        expediteur_id=user_id,
        contenu=contenu,
        document_url=document_url,
    )

    # Une conversation suggérée devient "en contact"
    if conversation.statut == "SUGGEREE":
        conversation.statut = "EN_CONTACT"

    conversation.updated_at = datetime.utcnow()

    db.add(msg)
    db.commit()
    db.refresh(msg)

    # -----------------------------------------------------------------------
    # Notification du destinataire
    # -----------------------------------------------------------------------

    destinataire_id = (
        conversation.destinataire_id
        if user_id == conversation.initiateur_id
        else conversation.initiateur_id
    )

    destinataire = db.get(
        User,
        destinataire_id,
    )

    if destinataire:
        try:
            create_notification(
                db,
                destinataire_id,
                "EMAIL",
                destinataire.email,
                (
                    "Vous avez reçu un nouveau message "
                    "dans une conversation."
                ),
                sujet="Nouveau message",
            )
        except Exception:
            # L'échec de l'email ne doit pas annuler
            # l'envoi du message.
            pass

    return {
        # Backend
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "expediteur_id": msg.expediteur_id,
        "contenu": msg.contenu,
        "document_url": msg.document_url,
        "created_at": msg.created_at,

        # Frontend
        "conversationId": msg.conversation_id,
        "senderId": msg.expediteur_id,
        "text": msg.contenu,
        "documentUrl": msg.document_url,
        "createdAt": msg.created_at,

        "status": STATUS_TO_FRONT.get(
            conversation.statut,
            str(conversation.statut).lower(),
        ),
    }


# ---------------------------------------------------------------------------
# Lire les messages
# ---------------------------------------------------------------------------

def get_messages(
    conversation_id: int,
    user_id: int,
    db: Session,
):
    conversation = get_conversation(
        conversation_id,
        user_id,
        db,
    )

    # La première consultation fait passer
    # SUGGEREE -> CONSULTEE
    if conversation.statut == "SUGGEREE":
        conversation.statut = "CONSULTEE"
        db.commit()

    messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation.id
        )
        .order_by(
            Message.created_at.asc()
        )
        .all()
    )

    return [
        serialize_message(message)
        for message in messages
    ]


# ---------------------------------------------------------------------------
# Changer le statut
# ---------------------------------------------------------------------------

def update_conversation_status(
    conversation_id: int,
    user_id: int,
    statut: str,
    db: Session,
):
    if statut not in CONVERSATION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Statut invalide. "
                f"Valeurs : {CONVERSATION_STATUSES}"
            ),
        )

    conversation = get_conversation(
        conversation_id,
        user_id,
        db,
    )

    conversation.statut = statut
    conversation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(conversation)

    return {
        "id": conversation.id,
        "statut": conversation.statut,
        "status": STATUS_TO_FRONT.get(
            conversation.statut,
            str(conversation.statut).lower(),
        ),
        "message": (
            f"Statut mis à jour : "
            f"{conversation.statut}"
        ),
    }


# ---------------------------------------------------------------------------
# Upload document
# ---------------------------------------------------------------------------

def upload_document(
    conversation_id: int,
    user_id: int,
    nom_fichier: str,
    url: str,
    type_fichier: str,
    taille: int,
    db: Session,
):
    from app.models.conversations import DocumentMessage

    conversation = get_conversation(
        conversation_id,
        user_id,
        db,
    )

    msg = Message(
        conversation_id=conversation.id,
        expediteur_id=user_id,
        document_url=url,
    )

    db.add(msg)
    db.flush()

    doc = DocumentMessage(
        message_id=msg.id,
        conversation_id=conversation.id,
        expediteur_id=user_id,
        nom_fichier=nom_fichier,
        url=url,
        type_fichier=type_fichier,
        taille=taille,
    )

    db.add(doc)

    conversation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(doc)

    return {
        "message": "Document envoyé",
        "id": doc.id,
        "nom_fichier": doc.nom_fichier,
        "url": doc.url,
        "conversationId": conversation.id,
        "status": STATUS_TO_FRONT.get(
            conversation.statut,
            str(conversation.statut).lower(),
        ),
    }