from fastapi import FastAPI, HTTPException, Query
from app.models import Listing, MatchResult
from pydantic import BaseModel, Field
from app.mock_client import (
    get_listing_by_id,
    get_annonces_opposees,
    get_profil_entreprise,
    get_donnees_logistiques,
    enregistrer_match,
)
from app.scoring import calcul_score_global

app = FastAPI(title="Agent de Matching IA - Import/Export")


class FindMatchesRequest(BaseModel):
    listing_id: str = Field(
        ...,
        examples=["D001"],
        description="Identifiant du listing (offre ou demande) pour lequel chercher des correspondances."
    )


@app.post(
    "/api/matching/find-matches",
    response_model=list[MatchResult],
    summary="Trouver les meilleures correspondances pour un listing",
    description=(
        "Reçoit l'id d'un listing (offre ou demande) et retourne la liste des "
        "meilleurs matchs parmi les listings du type opposé, triés par score "
        "décroissant. Supporte la pagination et des filtres optionnels."
    ),
    responses={
        404: {"description": "Listing introuvable pour l'id fourni"},
        422: {"description": "Erreur de validation (paramètres invalides)"},
    },
)
def find_matches(
    payload: FindMatchesRequest,
    limit: int = Query(default=10, ge=1, le=100, description="Nombre max de résultats par page"),
    offset: int = Query(default=0, ge=0, description="Décalage pour la pagination"),
    top_n: int = Query(default=10, ge=1, le=100, description="Nombre max de correspondances retournées avant pagination"),
    score_min: float = Query(default=0.0, ge=0.0, le=100.0, description="Score global minimum (0-100)"),
    pays: str | None = Query(default=None, description="Filtrer par pays de l'annonce candidate"),
    prix_max: float | None = Query(default=None, ge=0.0, description="Prix unitaire maximum de l'annonce candidate"),
):
    listing_source = get_listing_by_id(payload.listing_id)
    if listing_source is None:
        raise HTTPException(status_code=404, detail=f"Listing '{payload.listing_id}' introuvable")

    candidats = get_annonces_opposees(listing_source)

    # Filtres optionnels appliqués avant le calcul du score (optimisation)
    if pays is not None:
        candidats = [c for c in candidats if c.pays.lower() == pays.lower()]
    if prix_max is not None:
        candidats = [c for c in candidats if c.prix_unitaire <= prix_max]

    resultats = []
    for candidat in candidats:
        if listing_source.type == "offre":
            resultat = calcul_score_global(candidat, listing_source)
        else:
            resultat = calcul_score_global(listing_source, candidat)

        enregistrer_match(resultat.model_dump(mode="json"))
        resultats.append(resultat)

    # Filtre score minimum (appliqué après calcul, car dépend du résultat)
    resultats = [r for r in resultats if r.score_global >= score_min]

    # Tri décroissant par score
    resultats.sort(key=lambda r: r.score_global, reverse=True)

    # Top N puis pagination
    resultats = resultats[:top_n]
    resultats = resultats[offset : offset + limit]

    return resultats


@app.get("/")
def root():
    return {"message": "Agent de Matching IA - Import/Export - API en ligne"}