"""
Endpoint interne service-à-service (spec §5.5), consommé par le matcher IA
(Stagiaire 3). Il n'est pas public : protégé par une clé d'API interne
(`X-Internal-Key`). Si aucune clé n'est configurée (développement), l'accès
reste ouvert par simplicité.
"""
from fastapi import APIRouter, HTTPException, Request
from database import prisma
from config import INTERNAL_API_KEY
from trust import compute_and_store_trust_score

router = APIRouter(prefix="/internal", tags=["internal"])


def _check_internal_key(request: Request):
    if INTERNAL_API_KEY and request.headers.get("X-Internal-Key") != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Clé interne invalide")


@router.get("/entreprises/{entreprise_id}/trust-score")
async def get_entreprise_trust_score(entreprise_id: str, request: Request):
    _check_internal_key(request)
    entreprise = await prisma.entreprise.find_unique(where={"id": entreprise_id})
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")

    try:
        return await compute_and_store_trust_score(entreprise_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
