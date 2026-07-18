from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.listing import Listing
from app.schemas.listing import ListingCreate, ListingUpdate


def serialize(listing: Listing):
    data = {column.name: getattr(listing, column.name) for column in Listing.__table__.columns}
    data["documents"] = data["documents"].split(",") if data.get("documents") else []
    return data


def create_listing(data: ListingCreate, user_id: int, db: Session):
    values = data.model_dump()
    values["documents"] = ",".join(values["documents"] or [])
    listing = Listing(user_id=user_id, **values)
    db.add(listing); db.commit(); db.refresh(listing)
    return serialize(listing)


def get_all_listings(db: Session, country=None, category=None, listing_type=None, min_price=None, max_price=None,
                     certification=None, page=1, page_size=20):
    query = db.query(Listing).filter(Listing.statut == "active", Listing.suspendue.is_(False))
    if country: query = query.filter((Listing.pays_origine == country) | (Listing.pays_destination == country))
    if category: query = query.filter(Listing.categorie == category)
    if listing_type: query = query.filter(Listing.type == listing_type)
    if min_price is not None: query = query.filter(Listing.prix >= min_price)
    if max_price is not None: query = query.filter(Listing.prix <= max_price)
    if certification: query = query.filter(Listing.certification == certification)
    total = query.count()
    rows = query.order_by(Listing.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "page": page, "page_size": page_size, "annonces": [serialize(row) for row in rows]}


def get_listing_by_id(listing_id: int, db: Session):
    listing = db.get(Listing, listing_id)
    if not listing: raise HTTPException(status_code=404, detail="Annonce non trouvée")
    return serialize(listing)


def owned_listing(listing_id: int, user_id: int, db: Session):
    listing = db.get(Listing, listing_id)
    if not listing: raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if listing.user_id != user_id: raise HTTPException(status_code=403, detail="Non autorisé")
    return listing


def update_listing(listing_id: int, data: ListingUpdate, user_id: int, db: Session):
    listing = owned_listing(listing_id, user_id, db)
    values = data.model_dump(exclude_unset=True)
    if "documents" in values: values["documents"] = ",".join(values["documents"] or [])
    for key, value in values.items(): setattr(listing, key, value)
    db.commit(); db.refresh(listing)
    return serialize(listing)


def set_listing_state(listing_id: int, user_id: int, db: Session, state: str):
    listing = owned_listing(listing_id, user_id, db)
    if state == "suspend": listing.suspendue, listing.statut = True, "suspendue"
    elif state == "resume": listing.suspendue, listing.statut = False, "active"
    else: listing.statut = "cloturee"
    db.commit(); db.refresh(listing)
    return serialize(listing)


def delete_listing(listing_id: int, user_id: int, db: Session):
    listing = owned_listing(listing_id, user_id, db)
    db.delete(listing); db.commit()
    return {"message": "Annonce supprimée"}
