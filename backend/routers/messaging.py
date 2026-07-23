import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import prisma
from deps import get_current_user

router = APIRouter(prefix="/api/conversations", tags=["messaging"])


class SendMessageRequest(BaseModel):
    text: str


class UpdateStatusRequest(BaseModel):
    status: str | None = None


class GetOrCreateConversationRequest(BaseModel):
    listingId: str
    counterpartUserId: str | None = None


@router.post("/get-or-create")
async def get_or_create_conversation(body: GetOrCreateConversationRequest, user=Depends(get_current_user)):
    vendeur_id = user.id
    acheteur_id = body.counterpartUserId

    if not acheteur_id:
        annonce = await prisma.annonce.find_unique(where={"id": body.listingId})
        if not annonce:
            raise HTTPException(status_code=404, detail="Annonce introuvable")
        acheteur_id = annonce.utilisateurId

    existing = await prisma.conversation.find_first(
        where={
            "annonceId": body.listingId,
            "OR": [
                {"vendeurId": vendeur_id, "acheteurId": acheteur_id},
                {"vendeurId": acheteur_id, "acheteurId": vendeur_id},
            ],
        },
        include={
            "annonce": True,
            "vendeur": True,
            "acheteur": True,
            "messages": True,
        },
    )

    if existing:
        return _serialize_conversation(existing, user.id)

    conversation = await prisma.conversation.create(
        data={
            "annonceId": body.listingId,
            "vendeurId": vendeur_id,
            "acheteurId": acheteur_id,
            "statut": "SUGGEREE",
            "nombreMessages": 0,
        },
        include={
            "annonce": True,
            "vendeur": True,
            "acheteur": True,
            "messages": True,
        },
    )

    return _serialize_conversation(conversation, user.id)


@router.get("")
async def get_conversations(user=Depends(get_current_user)):
    conversations = await prisma.conversation.find_many(
        where={
            "OR": [
                {"vendeurId": user.id},
                {"acheteurId": user.id},
            ]
        },
        include={
            "annonce": True,
            "vendeur": True,
            "acheteur": True,
            "messages": True,
        },
        order={"updatedAt": "desc"},
    )

    return [_serialize_conversation(c, user.id) for c in conversations]


@router.get("/{conversation_id}")
async def get_conversation_by_id(conversation_id: str, user=Depends(get_current_user)):
    conversation = await prisma.conversation.find_unique(
        where={"id": conversation_id},
        include={
            "annonce": True,
            "vendeur": True,
            "acheteur": True,
            "messages": True,
        },
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    result = _serialize_conversation(conversation, user.id)
    return result


@router.post("/{conversation_id}/messages")
async def send_message(conversation_id: str, body: SendMessageRequest, user=Depends(get_current_user)):
    if not body.text:
        raise HTTPException(status_code=400, detail="Texte requis")

    conversation = await prisma.conversation.find_unique(where={"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    message = await prisma.message.create(
        data={
            "conversationId": conversation_id,
            "expediteurId": user.id,
            "contenu": body.text,
            "estLu": False,
        }
    )

    new_statut = conversation.statut
    if conversation.statut == "SUGGEREE":
        new_statut = "EN_CONTACT"

    await prisma.conversation.update(
        where={"id": conversation_id},
        data={
            "nombreMessages": {"increment": 1},
            "dateDernierMessage": __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
            "statut": new_statut,
        },
    )

    return {
        "id": message.id,
        "senderId": message.expediteurId,
        "text": message.contenu,
        "sentAt": message.dateEnvoi.isoformat(),
    }


@router.put("/{conversation_id}")
async def update_conversation_status(conversation_id: str, body: UpdateStatusRequest, user=Depends(get_current_user)):
    conversation = await prisma.conversation.find_unique(where={"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    if user.id not in (conversation.vendeurId, conversation.acheteurId):
        raise HTTPException(status_code=403, detail="Non autorisé")

    updated = await prisma.conversation.update(
        where={"id": conversation_id},
        data={"statut": body.status if body.status else conversation.statut},
        include={
            "annonce": True,
            "vendeur": True,
            "acheteur": True,
            "messages": True,
        },
    )
    return _serialize_conversation(updated, user.id)


def _serialize_conversation(c, current_user_id: str) -> dict:
    name = ""
    if current_user_id == c.vendeurId:
        name = f"{c.acheteur.nom} {c.acheteur.prenom}"
    else:
        name = f"{c.vendeur.nom} {c.vendeur.prenom}"

    sorted_msgs = sorted(c.messages, key=lambda m: m.dateEnvoi or __import__("datetime").datetime.min.replace(tzinfo=__import__("datetime").timezone.utc))

    return {
        "id": c.id,
        "listingId": c.annonceId,
        "listingProduct": c.annonce.titre if c.annonce else "",
        "counterpart": {"name": name, "country": ""},
        "status": c.statut.lower(),
        "updatedAt": c.updatedAt.isoformat() if c.updatedAt else None,
        "messages": [
            {
                "id": m.id,
                "senderId": m.expediteurId,
                "text": m.contenu,
                "sentAt": m.dateEnvoi.isoformat() if m.dateEnvoi else None,
            }
            for m in sorted_msgs
        ],
    }
