import logging
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.listing import Listing
from app.schemas.listing import ListingCreate, ListingUpdate
from app.services.logistics_service import estimate as logistics_estimate
from app.services.currency_service import convert as currency_convert

logger = logging.getLogger("import_export_api")


def serialize(listing: Listing):
    data = {column.name: getattr(listing, column.name) for column in Listing.__table__.columns}
    documents = data.get("documents")
    data["documents"] = documents.split(",") if documents else []

    raw_type = data.get("type")
    if raw_type == "offre":
        data["type"] = "offer"
    elif raw_type == "demande":
        data["type"] = "demand"

    data["product"] = data.get("titre")
    data["quantity"] = data.get("quantite")
    data["category"] = data.get("categorie")
    data["price"] = data.get("prix")
    data["currency"] = data.get("devise")
    data["status"] = data.get("statut")
    data["ownerId"] = data.get("user_id")
    data["country"] = data.get("pays_origine") or data.get("pays_destination")
    data["country_label"] = data["country"]
    data["quantityUnit"] = data.get("quantity_unit")

    raw_backend_type = data.get("type")

    if raw_backend_type == "offre":
        data["deadline"] = data.get("date_disponibilite")
    else:
        data["deadline"] = data.get("date_limite")

    data["destination"] = data.get("pays_destination")
    data["destinationCountry"] = data.get("pays_destination")
    data["originCountry"] = data.get("pays_origine")
    iso_to_label = {
        "TN": "Tunisie",
        "FR": "France",
        "IT": "Italie",
        "ES": "Espagne",
        "DE": "Allemagne",
        "BE": "Belgique",
        "NL": "Pays-Bas",
        "MA": "Maroc",
        "DZ": "Algérie",
        "EG": "Égypte",
        "TR": "Turquie",
        "CN": "Chine",
        "IN": "Inde",
        "US": "États-Unis",
        "CA": "Canada",
    }
    if isinstance(data.get("country"), str):
        country_code = data["country"].strip().upper()
        data["country"] = iso_to_label.get(country_code, country_code)

    raw_certification = data.get("certification")
    if raw_certification:
        data["certifications"] = [item.strip() for item in str(raw_certification).split(",") if item.strip()]
    else:
        data["certifications"] = []

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

    values["documents"] = ",".join(
        values.get("documents") or []
)

    deadline = values.pop("deadline", None)

    if values.get("type") == "offre":
        values["date_disponibilite"] = deadline
        values["date_limite"] = None

    elif values.get("type") == "demande":
        values["date_limite"] = deadline
        values["date_disponibilite"] = None

    values = await _enrichir_logistique(values)

    listing = Listing(
        user_id=user_id,
        **values,
)

    db.add(listing)
    db.commit()
    db.refresh(listing)

    return serialize(listing)


async def get_all_listings(db: Session, country=None, category=None, listing_type=None, min_price=None, max_price=None,
                            certification=None, incoterm=None, page=1, page_size=20, devise_affichage=None, q=None):
    # Convert country name to ISO code if needed
    country_iso = None
    if country:
        country_mapping = {
            "Tunisie": "TN",
            "France": "FR",
            "Italie": "IT",
            "Espagne": "ES",
            "Allemagne": "DE",
            "Belgique": "BE",
            "Pays-Bas": "NL",
            "Maroc": "MA",
            "Algérie": "DZ",
            "Égypte": "EG",
            "Turquie": "TR",
            "Chine": "CN",
            "Inde": "IN",
            "États-Unis": "US",
            "Canada": "CA",
        }
        country_iso = country_mapping.get(country, country.upper())
    
    # Convert listing type from frontend format to backend format
    listing_type_normalized = None
    if listing_type:
        type_mapping = {
            "offer": "offre",
            "demand": "demande",
            "offre": "offre",
            "demande": "demande",
        }
        listing_type_normalized = type_mapping.get(listing_type.lower(), listing_type)
    
    query = db.query(Listing).filter(Listing.statut == "active", Listing.suspendue.is_(False))
    if country_iso: query = query.filter((Listing.pays_origine == country_iso) | (Listing.pays_destination == country_iso))
    if category: query = query.filter(Listing.categorie == category)
    if listing_type_normalized: query = query.filter(Listing.type == listing_type_normalized)
    if min_price is not None: query = query.filter(Listing.prix >= min_price)
    if max_price is not None: query = query.filter(Listing.prix <= max_price)
    if certification: query = query.filter(Listing.certification.ilike(certification))
    if incoterm: query = query.filter(Listing.incoterm == incoterm.upper())
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Listing.titre.ilike(term),
                Listing.description.ilike(term),
                Listing.categorie.ilike(term),
                Listing.certification.ilike(term),
                Listing.pays_origine.ilike(term),
                Listing.pays_destination.ilike(term),
                Listing.incoterm.ilike(term),
            )
        )
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
    for annonce in annonces:
        annonce.setdefault("prix_converti" , None)
        annonce.setdefault("devise_affichage", None)
        
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
    deadline = values.pop("deadline", None)

    listing_type = listing.type
    if deadline is not None:
        if listing_type == "offre":
            values["date_disponibilite"] = deadline
            values["date_limite"] = None

        elif listing_type == "demande":
            values["date_limite"] = deadline
            values["date_disponibilite"] = None
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