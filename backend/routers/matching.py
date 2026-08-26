import json
from fastapi import APIRouter, Depends, Query
from database import prisma
from deps import get_current_user

router = APIRouter(prefix="/api/matching-results", tags=["matching"])


@router.get("")
async def get_matches(
    minScore: int | None = None,
    listingId: str | None = None,
    user=Depends(get_current_user),
):
    where = {"utilisateurId": user.id}
    if listingId:
        where["annonceId"] = listingId

    matches = await prisma.matchingresult.find_many(
        where=where,
        include={"annonce": {"include": {"locationOrigine": True, "categorie": True}}},
        order={"matchScore": "desc"},
    )

    results = []
    for m in matches:
        reasons = {}
        try:
            reasons = json.loads(m.reasons) if m.reasons else {}
        except (json.JSONDecodeError, TypeError):
            pass

        listing_data = None
        if m.annonce:
            listing_data = {
                "id": m.annonce.id,
                "type": m.annonce.type,
                "product": m.annonce.titre,
                "price": m.annonce.prix,
                "currency": m.annonce.devise,
                "country": m.annonce.locationOrigine.pays if m.annonce.locationOrigine else "",
                "category": m.annonce.categorie.nom if m.annonce.categorie else "",
                "status": m.annonce.statut,
            }

        results.append({
            "id": m.id,
            "listingId": m.annonceId,
            "matchScore": m.matchScore,
            "reasons": reasons,
            "counterpart": {
                "name": m.counterpartName,
                "country": m.counterpartCountry,
                "ownerId": m.counterpartOwnerId,
            },
            "counterpartListingId": m.counterpartListingId,
            "listing": listing_data,
        })

    if minScore:
        results = [r for r in results if r["matchScore"] >= minScore]

    return results
