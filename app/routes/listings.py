from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.listing_controller import create_listing, delete_listing, get_all_listings, get_listing_by_id, set_listing_state, update_listing, serialize
from app.middleware.auth import verify_token
from app.schemas.listing import ListingCreate, ListingUpdate
from app.models.listing import Listing

router = APIRouter(prefix="/listings", tags=["Annonces"])


@router.get("", summary="Rechercher des annonces", description="Retourner la liste des annonces avec filtres optionnels.")
async def get_listings(
    country: Optional[str] = None, 
    category: Optional[str] = None, 
    type: Optional[str] = None,
    min_price: Optional[float] = None, 
    max_price: Optional[float] = None, 
    certification: Optional[str] = None,
    certifications: Optional[str] = None,  # Frontend alias
    q: Optional[str] = None, 
    devise_affichage: Optional[str] = Query(default=None),
    page: int = Query(1, ge=1), 
    page_size: int = Query(20, ge=1, le=100), 
    db: Session = Depends(get_db)
):
    # Frontend compat: accept "certifications" from frontend and pick first if provided
    cert_filter = certification
    if not cert_filter and certifications:
        try:
            cert_filter = certifications.split(",")[0].strip()
        except (AttributeError, IndexError):
            cert_filter = None
    
    # Ensure type matches backend enum (offre/demande) or accept frontend format (offer/demand)
    listing_type = type
    if listing_type == "offer":
        listing_type = "offre"
    elif listing_type == "demand":
        listing_type = "demande"
    
    result = await get_all_listings(
        db=db, country=country, category=category, listing_type=listing_type,
        min_price=min_price, max_price=max_price, certification=cert_filter,
        page=page, page_size=page_size, devise_affichage=devise_affichage, q=q
    )
    return result.get("annonces", result) if isinstance(result, dict) else result

@router.get("/mine", summary="Mes annonces", description="Retourner les annonces de l'utilisateur connecté.")
async def get_my_listings(current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    rows = db.query(Listing).filter(Listing.user_id == current_user["id"]).order_by(Listing.created_at.desc()).all()
    return [serialize(row) for row in rows]

# IMPORTANT : /search doit être déclaré AVANT /{listing_id}, sinon FastAPI/Starlette
# interprète "search" comme une valeur de listing_id et renvoie 422 avant même
# d'atteindre cette route (bug corrigé).
@router.get("/search", summary="Recherche avancée d'annonces",
            description="Recherche avec filtres multiples : pays, catégorie, prix, certification, Incoterm, devise d'affichage et pagination")
async def search_listings(
    pays: Optional[str] = None,
    categorie: Optional[str] = None,
    type: Optional[str] = None,
    prix_min: Optional[float] = None,
    prix_max: Optional[float] = None,
    certification: Optional[str] = None,
    certifications: Optional[str] = None,  # Frontend alias
    incoterm: Optional[str] = None,
    q: Optional[str] = None,
    min_price: Optional[float] = None,  # Also accept min_price/max_price
    max_price: Optional[float] = None,
    devise_affichage: Optional[str] = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    # Frontend compat: accept "certifications" and pick first if provided
    cert_filter = certification or (certifications.split(",")[0] if certifications else None)
    # Backend compat: prix_min/prix_max take precedence, but also accept min_price/max_price
    min_p = prix_min if prix_min is not None else min_price
    max_p = prix_max if prix_max is not None else max_price
    
    return await get_all_listings(
        db=db,
        country=pays,
        category=categorie,
        listing_type=type,
        min_price=min_p,
        max_price=max_p,
        certification=cert_filter,
        incoterm=incoterm,
        page=page,
        page_size=page_size,
        devise_affichage=devise_affichage,
        q=q,
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