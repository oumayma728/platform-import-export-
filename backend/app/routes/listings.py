from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.middleware import auth_middleware
from app.schemas.listing import ListingCreate, ListingOut, ListingUpdate
from app.models.models import User
from app.services import listing_service

router = APIRouter()

@router.post(
    "/", 
    response_model=ListingOut, 
    status_code=status.HTTP_201_CREATED,
    summary="Créer un nouveau listing",
    description="Permet à une entreprise de créer une offre ou une demande."
)
def create_listing(
    listing_in: ListingCreate, 
    db: Session = Depends(auth_middleware.get_db), 
    current_user: User = Depends(auth_middleware.get_current_user)
):
    return listing_service.create_listing(db, listing_in, current_user)


@router.get(
    "/search", 
    response_model=List[ListingOut],
    summary="Rechercher des listings avec filtres",
    description="Permet de rechercher des listings actifs en filtrant par pays, catégorie, prix et certification."
)
def search_listings(
    pays: Optional[str] = Query(None, description="Filtrer par pays"),
    categorie: Optional[str] = Query(None, description="Filtrer par catégorie"),
    prixMin: Optional[float] = Query(None, description="Prix minimum"),
    prixMax: Optional[float] = Query(None, description="Prix maximum"),
    certification: Optional[str] = Query(None, description="Filtrer par certification exigée/proposée"),
    skip: int = Query(0, description="Pagination: nombre d'éléments à passer"),
    limit: int = Query(20, description="Pagination: nombre d'éléments à retourner"),
    db: Session = Depends(auth_middleware.get_db)
):
    return listing_service.search_listings(db, pays, categorie, prixMin, prixMax, certification, skip, limit)


@router.get(
    "/me", 
    response_model=List[ListingOut],
    summary="Obtenir mes propres listings",
    description="Renvoie tous les listings de l'utilisateur connecté, y compris ceux clôturés ou suspendus."
)
def get_my_listings(
    db: Session = Depends(auth_middleware.get_db), 
    current_user: User = Depends(auth_middleware.get_current_user)
):
    return listing_service.get_my_listings(db, current_user)


@router.get(
    "/{id}", 
    response_model=ListingOut,
    summary="Obtenir un listing par son ID",
    description="Renvoie les détails complets d'un listing."
)
def get_listing(id: str, db: Session = Depends(auth_middleware.get_db)):
    return listing_service.get_listing(db, id)


@router.put(
    "/{id}", 
    response_model=ListingOut,
    summary="Mettre à jour un listing complet",
    description="Permet à l'entreprise propriétaire de modifier les données d'un listing."
)
def update_listing(
    id: str, 
    listing_in: ListingUpdate, 
    db: Session = Depends(auth_middleware.get_db), 
    current_user: User = Depends(auth_middleware.get_current_user)
):
    return listing_service.update_listing(db, id, listing_in, current_user)


@router.delete(
    "/{id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un listing",
    description="Permet à l'entreprise propriétaire (OU à l'Administrateur) de supprimer définitivement un listing."
)
def delete_listing(
    id: str, 
    db: Session = Depends(auth_middleware.get_db), 
    current_user: User = Depends(auth_middleware.get_current_user)
):
    listing_service.delete_listing(db, id, current_user)
    return


@router.patch(
    "/{id}/close", 
    response_model=ListingOut,
    summary="Clôturer un listing",
    description="Permet à l'entreprise propriétaire (OU à l'Administrateur) de passer le statut du listing à CLOTUREE (par ex: marché conclu)."
)
def close_listing(
    id: str, 
    db: Session = Depends(auth_middleware.get_db), 
    current_user: User = Depends(auth_middleware.get_current_user)
):
    return listing_service.close_listing(db, id, current_user)
