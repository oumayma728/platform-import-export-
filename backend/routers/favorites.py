from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import prisma
from deps import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


class AddFavoriteRequest(BaseModel):
    listingId: str


@router.get("")
async def get_favorites(user=Depends(get_current_user)):
    favorites = await prisma.favori.find_many(where={"userId": user.id})
    return [
        {"id": f.id, "userId": f.userId, "listingId": f.listingId, "createdAt": f.createdAt.isoformat()}
        for f in favorites
    ]


@router.get("/check/{listing_id}")
async def check_favorite(listing_id: str, user=Depends(get_current_user)):
    fav = await prisma.favori.find_unique(
        where={"userId_listingId": {"userId": user.id, "listingId": listing_id}}
    )
    return {"isFavorite": fav is not None}


@router.post("")
async def add_favorite(body: AddFavoriteRequest, user=Depends(get_current_user)):
    existing = await prisma.favori.find_unique(
        where={"userId_listingId": {"userId": user.id, "listingId": body.listingId}}
    )
    if existing:
        return {"success": True, "isFavorite": True}

    await prisma.favori.create(data={"userId": user.id, "listingId": body.listingId})
    return {"success": True, "isFavorite": True}


@router.delete("/{listing_id}")
async def remove_favorite(listing_id: str, user=Depends(get_current_user)):
    await prisma.favori.delete_many(where={"userId": user.id, "listingId": listing_id})
    return {"success": True, "isFavorite": False}
