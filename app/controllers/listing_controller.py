import logging
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.listing import Listing
from app.schemas.listing import ListingCreate, ListingUpdate
from app.services.logistics_service import estimate as logistics_estimate
from app.services.currency_service import convert as currency_convert

logger = logging.getLogger("import_export_api")


def serialize(listing: Listing):
    data = {column.name: getattr(listing, column.name) for column in Listing.__table__.columns}
    data["documents"] = data["documents"].split(",") if data.get("documents") else []
    return data


async def _enrichir_logistique(values: dict) -> dict:
    """Calcule distance/coût/délai si pays_origine et pays_destination sont des codes
    ISO reconnus. Ne bloque jamais la création/modification d'une annonce : si les pays
    sont manquants ou non reconnus (ex: nom complet au lieu d'un code ISO), l'enrichissement
    est simplement ignoré plutôt que de faire échouer toute la requête."""
    origine = values.get("pays_origine")
    destination = values.get("pays_destination")
    if not origine or not destination:
        return values

    try:
        resultat = await logistics_estimate(origine, destination)
        values["distance_km"] = resultat["distance_km"]
        values["estimated_cost_usd"] = resultat["estimated_cost_usd"]
        values["estimated_days"] = resultat["estimated_days"]
    except ValueError as exc:
        logger.info("Enrichissement logistique ignoré (%s -> %s) : %s", origine, destination, exc)
    return values


async def create_listing(data: ListingCreate, user_id: int, db: Session):
    values = data.model_dump()
    values["documents"] = ",".join(values["documents"] or [])
    values = await _enrichir_logistique(values)
    listing = Listing(user_id=user_id, **values)
    db.add(listing); db.commit(); db.refresh(listing)
    return serialize(listing)


async def get_all_listings(db: Session, country=None, category=None, listing_type=None, min_price=None, max_price=None,
                            certification=None, page=1, page_size=20, devise_affichage=None):
    query = db.query(Listing).filter(Listing.statut == "active", Listing.suspendue.is_(False))
    if country: query = query.filter((Listing.pays_origine == country) | (Listing.pays_destination == country))
    if category: query = query.filter(Listing.categorie == category)
    if listing_type: query = query.filter(Listing.type == listing_type)
    if min_price is not None: query = query.filter(Listing.prix >= min_price)
    if max_price is not None: query = query.filter(Listing.prix <= max_price)
    if certification: query = query.filter(Listing.certification == certification)
    total = query.count()
    rows = query.order_by(Listing.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    annonces = [serialize(row) for row in rows]

    if devise_affichage:
        for annonce in annonces:
            prix = annonce.get("prix")
            devise_origine = annonce.get("devise")
            if prix is None or not devise_origine:
                continue
            try:
                resultat = await currency_convert(prix, devise_origine, devise_affichage)
                annonce["prix_converti"] = resultat["converted_amount"]
                annonce["devise_affichage"] = devise_affichage.upper()
            except ValueError as exc:
                logger.info("Conversion de devise ignorée pour l'annonce %s : %s", annonce.get("id"), exc)

    return {"total": total, "page": page, "page_size": page_size, "annonces": annonces}


def get_listing_by_id(listing_id: int, db: Session):
    listing = db.get(Listing, listing_id)
    if not listing: raise HTTPException(status_code=404, detail="Annonce non trouvée")
    return serialize(listing)


def owned_listing(listing_id: int, user_id: int, db: Session):
    listing = db.get(Listing, listing_id)
    if not listing: raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if listing.user_id != user_id: raise HTTPException(status_code=403, detail="Non autorisé")
    return listing


async def update_listing(listing_id: int, data: ListingUpdate, user_id: int, db: Session):
    listing = owned_listing(listing_id, user_id, db)
    values = data.model_dump(exclude_unset=True)
    if "documents" in values: values["documents"] = ",".join(values["documents"] or [])

    # Ré-enrichir uniquement si le pays d'origine ou de destination a changé dans cette requête
    if "pays_origine" in values or "pays_destination" in values:
        merge = {
            "pays_origine": values.get("pays_origine", listing.pays_origine),
            "pays_destination": values.get("pays_destination", listing.pays_destination),
        }
        values.update(await _enrichir_logistique(merge))

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