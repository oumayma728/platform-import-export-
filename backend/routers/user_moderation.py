"""
Endpoints utilisateur (spec §6) : signalements et avis sont créés par les
utilisateurs de la plateforme, pas par l'admin. Les routes /admin restent
strictement réservées au personnel de modération (spec §4).
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import prisma
from deps import get_current_user
from trust import compute_and_store_trust_score

router = APIRouter(prefix="/api", tags=["moderation-public"])


class PublicReportCreateRequest(BaseModel):
    annonceId: str | None = None
    cibleUserId: str | None = None
    conversationId: str | None = None
    cibleType: str | None = None
    cibleId: str | None = None
    type: str
    motif: str


class PublicReviewCreateRequest(BaseModel):
    entrepriseId: str
    annonceId: str | None = None
    conversationId: str
    note: int
    commentaire: str | None = None


@router.post("/reports")
async def create_report(body: PublicReportCreateRequest, user=Depends(get_current_user)):
    cible_type = (body.cibleType or "").upper()

    if not cible_type:
        if body.annonceId:
            cible_type = "ANNONCE"
        elif body.conversationId:
            cible_type = "CONVERSATION"
        elif body.cibleUserId:
            cible_type = "UTILISATEUR"
        else:
            raise HTTPException(status_code=400, detail="Cible du signalement manquante")

    if cible_type == "ANNONCE" and not body.annonceId:
        raise HTTPException(status_code=400, detail="Une annonceId est requise pour signaler une annonce")
    if cible_type == "CONVERSATION" and not body.conversationId:
        raise HTTPException(status_code=400, detail="Une conversationId est requise pour signaler une conversation")

    # La cible doit exister (sinon erreur 404 propre au lieu d'une contrainte FK)
    if body.annonceId:
        if not await prisma.annonce.find_unique(where={"id": body.annonceId}):
            raise HTTPException(status_code=404, detail="Annonce introuvable")
    if body.conversationId:
        if not await prisma.conversation.find_unique(where={"id": body.conversationId}):
            raise HTTPException(status_code=404, detail="Conversation introuvable")
    if body.cibleUserId:
        if not await prisma.utilisateur.find_unique(where={"id": body.cibleUserId}):
            raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    cible_id = body.cibleId or body.cibleUserId or body.annonceId or body.conversationId

    report = await prisma.report.create(
        data={
            "reporterId": user.id,
            "annonceId": body.annonceId,
            "cibleUserId": body.cibleUserId,
            "conversationId": body.conversationId,
            "cibleType": cible_type,
            "cibleId": cible_id,
            "type": body.type,
            "motif": body.motif,
            "statut": "pending",
        }
    )
    return {"id": report.id, "statut": report.statut}


@router.post("/reviews")
async def create_review(body: PublicReviewCreateRequest, user=Depends(get_current_user)):
    if body.note < 1 or body.note > 5:
        raise HTTPException(status_code=400, detail="La note doit être entre 1 et 5")

    # spec §5.4 : un avis n'existe qu'après une transaction conclue
    conversation = await prisma.conversation.find_unique(where={"id": body.conversationId})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if conversation.statut.upper() not in ("CONCLUE", "CONCLUDED"):
        raise HTTPException(status_code=400, detail="Un avis ne peut être laissé qu'après une transaction conclue")

    # L'auteur doit être partie prenante de la conversation
    if user.id not in (conversation.vendeurId, conversation.acheteurId):
        raise HTTPException(status_code=403, detail="Vous n'êtes pas partie prenante de cette conversation")

    # Une seule revue par (auteur, conversation)
    existing = await prisma.review.find_first(
        where={"auteurId": user.id, "conversationId": body.conversationId}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis pour cette conversation")

    entreprise = await prisma.entreprise.find_unique(where={"id": body.entrepriseId})
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")

    review = await prisma.review.create(
        data={
            "auteurId": user.id,
            "entrepriseId": body.entrepriseId,
            "annonceId": body.annonceId or conversation.annonceId,
            "conversationId": body.conversationId,
            "note": body.note,
            "commentaire": body.commentaire,
        }
    )

    # Badge automatique (legacy) + recompute du trust score
    all_reviews = await prisma.review.find_many(where={"entrepriseId": body.entrepriseId})
    avg = sum(r.note for r in all_reviews) / len(all_reviews)

    if avg >= 4.5 and len(all_reviews) >= 5:
        badge_type = "top_exporter" if entreprise.role == "exporter" else "top_importer"
        existing_badge = await prisma.trustbadge.find_first(
            where={"entrepriseId": body.entrepriseId, "badgeType": badge_type, "estActif": True}
        )
        if not existing_badge:
            await prisma.trustbadge.create(
                data={
                    "entrepriseId": body.entrepriseId,
                    "badgeType": badge_type,
                    "description": f"Note moyenne de {round(avg, 1)}/5 sur {len(all_reviews)} avis",
                }
            )

    await compute_and_store_trust_score(body.entrepriseId)

    return {"id": review.id, "note": review.note}
