from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import verify_token

router = APIRouter(prefix="/favorites", tags=["Favoris"])

# Stockage mémoire simple pour supporter la compatibilité rapide avec le frontend.
# En production, ce stockage devrait être remplacé par une vraie table SQLAlchemy.
USER_FAVORITES: dict[int, set[int]] = {}


class FavoritePayload(BaseModel):
    listingId: int


@router.get("", summary="Lister mes favoris")
def list_favorites(current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    del db
    listing_ids = USER_FAVORITES.setdefault(current_user["id"], set())
    return [
        {"id": f"fav-{listing_id}", "userId": current_user["id"], "listingId": listing_id, "createdAt": datetime.now(timezone.utc).isoformat()}
        for listing_id in sorted(listing_ids)
    ]


@router.get("/check/{listing_id}", summary="Vérifier si une annonce est en favoris")
def is_favorite(listing_id: int, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    del db
    listing_ids = USER_FAVORITES.setdefault(current_user["id"], set())
    return {"isFavorite": listing_id in listing_ids}


@router.post("", summary="Ajouter une annonce aux favoris")
def add_favorite(payload: FavoritePayload, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    del db
    if payload.listingId is None:
        raise HTTPException(status_code=400, detail="listingId requis")

    listing_ids = USER_FAVORITES.setdefault(current_user["id"], set())
    listing_ids.add(payload.listingId)
    return {"success": True, "isFavorite": True, "listingId": payload.listingId}


@router.delete("/{listing_id}", summary="Supprimer une annonce des favoris")
def remove_favorite(listing_id: int, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    del db
    listing_ids = USER_FAVORITES.setdefault(current_user["id"], set())
    listing_ids.discard(listing_id)
    return {"success": True, "isFavorite": False, "listingId": listing_id}
