from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.listing_controller import create_listing, delete_listing, get_all_listings, get_listing_by_id, set_listing_state, update_listing
from app.middleware.auth import verify_token
from app.schemas.listing import ListingCreate, ListingUpdate

router = APIRouter(prefix="/listings", tags=["Annonces"])


@router.get("", summary="Rechercher des annonces", description="Retourner la liste paginée des annonces avec filtres optionnels.", responses={200: {"description": "Liste des annonces"}})
async def get_listings(country: Optional[str] = None, category: Optional[str] = None, type: Optional[str] = None,
                        min_price: Optional[float] = None, max_price: Optional[float] = None, certification: Optional[str] = None,
                        devise_affichage: Optional[str] = Query(default=None, description="Code devise ISO (ex: EUR) pour convertir les prix affichés"),
                        page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return await get_all_listings(db, country, category, type, min_price, max_price, certification, page, page_size, devise_affichage)


# IMPORTANT : /search doit être déclaré AVANT /{listing_id}, sinon FastAPI/Starlette
# interprète "search" comme une valeur de listing_id et renvoie 422 avant même
# d'atteindre cette route (bug corrigé).
@router.get(
    "/search",
    summary="Recherche avancée d'annonces",
    description="Recherche avec filtres multiples : pays, catégorie, prix, certification, devise d'affichage et pagination"
)
async def search_listings(
    country: Optional[str] = None,
    category: Optional[str] = None,
    type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    certification: Optional[str] = None,
    incoterm: Optional[str] = None,
    devise_affichage: Optional[str] = Query(default=None, description="Code devise ISO (ex: EUR) pour convertir les prix affichés"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return await get_all_listings(
        db, country, category, type,
        min_price, max_price, certification,
        page, page_size, devise_affichage
    )


@router.post("", status_code=201, summary="Créer une annonce", description="Publier une nouvelle annonce import/export.", responses={201: {"description": "Annonce créée"}, 401: {"description": "Non authentifié"}})
async def create(listing: ListingCreate, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return await create_listing(listing, current_user["id"], db)


@router.get("/{listing_id}", summary="Voir une annonce", description="Consulter une annonce par son identifiant.", responses={200: {"description": "Annonce retournée"}, 404: {"description": "Annonce introuvable"}})
def get_listing(listing_id: int, db: Session = Depends(get_db)): return get_listing_by_id(listing_id, db)


@router.put("/{listing_id}", summary="Modifier une annonce", description="Mettre à jour une annonce appartenant à l'utilisateur connecté.", responses={200: {"description": "Annonce mise à jour"}, 401: {"description": "Non authentifié"}, 404: {"description": "Annonce introuvable"}})
async def update(listing_id: int, listing_data: ListingUpdate, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return await update_listing(listing_id, listing_data, current_user["id"], db)


@router.patch("/{listing_id}/close", summary="Clôturer une annonce", description="Clôturer une annonce publiée par l'utilisateur connecté.", responses={200: {"description": "Annonce clôturée"}, 401: {"description": "Non authentifié"}, 404: {"description": "Annonce introuvable"}})
def close(listing_id: int, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return set_listing_state(listing_id, current_user["id"], db, "close")


@router.patch("/{listing_id}/suspend", summary="Suspendre une annonce", description="Suspendre une annonce publiée par l'utilisateur connecté.", responses={200: {"description": "Annonce suspendue"}, 401: {"description": "Non authentifié"}, 404: {"description": "Annonce introuvable"}})
def suspend(listing_id: int, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return set_listing_state(listing_id, current_user["id"], db, "suspend")


@router.patch("/{listing_id}/resume", summary="Réactiver une annonce", description="Réactiver une annonce suspendue.", responses={200: {"description": "Annonce réactivée"}, 401: {"description": "Non authentifié"}, 404: {"description": "Annonce introuvable"}})
def resume(listing_id: int, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return set_listing_state(listing_id, current_user["id"], db, "resume")


@router.delete("/{listing_id}", summary="Supprimer une annonce", description="Supprimer une annonce appartenant à l'utilisateur connecté.", responses={200: {"description": "Annonce supprimée"}, 401: {"description": "Non authentifié"}, 404: {"description": "Annonce introuvable"}})
def delete(listing_id: int, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return delete_listing(listing_id, current_user["id"], db)