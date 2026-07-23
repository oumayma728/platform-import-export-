from fastapi import APIRouter, HTTPException
from database import prisma

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("/{user_id}")
async def get_public_account(user_id: str):
    user = await prisma.utilisateur.find_unique(
        where={"id": user_id},
        include={
            "entreprise": {
                "include": {"location": True, "certifications": True, "badges": {"where": {"estActif": True}}},
            }
        },
    )
    if not user:
        raise HTTPException(status_code=404, detail="Compte introuvable")

    reviews = await prisma.review.find_many(where={"entrepriseId": user.entrepriseId}) if user.entrepriseId else []
    avg_rating = round(sum(r.note for r in reviews) / len(reviews), 1) if reviews else None

    entreprise = user.entreprise

    return {
        "id": user.id,
        "role": entreprise.role if entreprise else "importer",
        "companyName": entreprise.nom if entreprise else "",
        "country": entreprise.location.pays if entreprise and entreprise.location else "",
        "sector": entreprise.secteurActivite or "" if entreprise else "",
        "certifications": [c.nom for c in entreprise.certifications] if entreprise else [],
        "badges": [{"type": b.badgeType, "description": b.description} for b in entreprise.badges] if entreprise else [],
        "memberSince": user.createdAt.strftime("%Y") if user.createdAt else "",
        "profileStatus": user.validationStatus or "pending",
        "description": entreprise.description or "" if entreprise else "",
        "averageRating": avg_rating,
        "reviewCount": len(reviews),
    }
