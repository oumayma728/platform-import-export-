import json
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from database import prisma
from deps import get_current_user, get_optional_user

router = APIRouter(prefix="/api/listings", tags=["listings"])


class ListingCreateRequest(BaseModel):
    model_config = {"extra": "ignore"}
    title: str | None = None
    product: str | None = None
    description: str | None = None
    type: str = "offer"
    price: float = 0
    currency: str = "EUR"
    quantity: float = 0
    quantityUnit: str = "unité"
    category: str | None = None
    country: str | None = None
    certifications: list[str] | None = None
    incoterm: str | None = None
    deadline: str | None = None


class ListingUpdateRequest(BaseModel):
    model_config = {"extra": "ignore"}
    title: str | None = None
    product: str | None = None
    description: str | None = None
    type: str | None = None
    price: float | None = None
    currency: str | None = None
    quantity: float | None = None
    quantityUnit: str | None = None
    certifications: list[str] | None = None
    deadline: str | None = None
    status: str | None = None


def serialize_listing(a) -> dict:
    loc_pays = ""
    if a.locationOrigine:
        loc_pays = a.locationOrigine.pays
    cat_nom = ""
    if a.categorie:
        cat_nom = a.categorie.nom
    incoterm_code = ""
    if a.incotermeAnnonces and len(a.incotermeAnnonces) > 0:
        incoterm_code = a.incotermeAnnonces[0].incoterme.code if a.incotermeAnnonces[0].incoterme else ""

    certs = []
    try:
        certs = json.loads(a.certifications) if a.certifications else []
    except (json.JSONDecodeError, TypeError):
        pass

    return {
        "id": a.id,
        "type": a.type,
        "product": a.titre,
        "description": a.description,
        "quantity": a.quantite,
        "quantityUnit": a.uniteQuantite,
        "price": a.prix,
        "currency": a.devise,
        "country": loc_pays,
        "category": cat_nom,
        "incoterm": incoterm_code,
        "deadline": a.dateLimite.strftime("%Y-%m-%d") if a.dateLimite else None,
        "certifications": certs,
        "ownerId": a.utilisateurId,
        "status": a.statut,
        "attachments": [
            {"name": d.nomFichier, "label": d.nomFichier, "type": "document"}
            for d in (a.documents or [])
        ],
        "createdAt": a.createdAt.isoformat() if a.createdAt else None,
    }


@router.get("/mine")
async def get_my_listings(user=Depends(get_current_user)):
    annonces = await prisma.annonce.find_many(
        where={"utilisateurId": user.id},
        include={
            "utilisateur": {"include": {"entreprise": {"include": {"location": True}}}},
            "categorie": True,
            "locationOrigine": True,
            "documents": True,
            "incotermeAnnonces": {"include": {"incoterme": True}},
        },
        order={"createdAt": "desc"},
    )
    return [serialize_listing(a) for a in annonces]


@router.get("")
async def get_listings(
    country: str | None = None,
    category: str | None = None,
    type: str | None = None,
    q: str | None = None,
    minPrice: float | None = None,
    maxPrice: float | None = None,
    certifications: str | None = None,
    status: str | None = None,
):
    where = {}
    if status:
        where["statut"] = status
    else:
        where["statut"] = {"notIn": ["suspended", "closed", "expired"]}

    if type:
        where["type"] = type

    if minPrice is not None or maxPrice is not None:
        where["prix"] = {}
        if minPrice is not None:
            where["prix"]["gte"] = minPrice
        if maxPrice is not None:
            where["prix"]["lte"] = maxPrice

    annonces = await prisma.annonce.find_many(
        where=where,
        include={
            "utilisateur": {"include": {"entreprise": {"include": {"location": True}}}},
            "categorie": True,
            "locationOrigine": True,
            "documents": True,
            "incotermeAnnonces": {"include": {"incoterme": True}},
        },
        order={"createdAt": "desc"},
    )

    results = [serialize_listing(a) for a in annonces]

    if country:
        results = [r for r in results if r["country"].lower() == country.lower()]
    if category:
        results = [r for r in results if r["category"].lower() == category.lower()]
    if q:
        ql = q.lower()
        results = [
            r for r in results
            if any(
                ql in f.lower()
                for f in [r["product"], r["category"], r["country"]] + r["certifications"]
                if f
            )
        ]
    if certifications:
        certs = [c.strip() for c in certifications.split(",")]
        results = [r for r in results if any(c in r["certifications"] for c in certs)]

    return results


@router.get("/{id}")
async def get_listing_by_id(id: str):
    annonce = await prisma.annonce.find_unique(
        where={"id": id},
        include={
            "utilisateur": {"include": {"entreprise": {"include": {"location": True}}}},
            "categorie": True,
            "locationOrigine": True,
            "locationDestination": True,
            "documents": True,
            "incotermeAnnonces": {"include": {"incoterme": True}},
        },
    )
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    return serialize_listing(annonce)


@router.post("")
async def create_listing(body: ListingCreateRequest, user=Depends(get_current_user)):
    categorie = await prisma.categorie.find_first(where={"nom": body.category or "Autre"})
    if not categorie:
        categorie = await prisma.categorie.create(data={"nom": body.category or "Autre"})

    location = None
    if body.country:
        location = await prisma.location.create(
            data={"pays": body.country, "ville": "", "codePostal": "", "adresse": "", "region": ""}
        )
    if not location:
        location = await prisma.location.find_first()
        if not location:
            location = await prisma.location.create(
                data={"pays": "", "ville": "", "codePostal": "", "adresse": "", "region": ""}
            )

    deadline_dt = None
    if body.deadline:
        try:
            from datetime import datetime, timezone
            deadline_dt = datetime.fromisoformat(body.deadline + "T23:59:59Z").replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            deadline_dt = None

    annonce = await prisma.annonce.create(
        data={
            "utilisateur": {"connect": {"id": user.id}},
            "categorie": {"connect": {"id": categorie.id}},
            "locationOrigine": {"connect": {"id": location.id}},
            "titre": body.product or body.title or "Sans titre",
            "description": body.description,
            "type": body.type if body.type in ("offer", "demand") else "offer",
            "prix": body.price,
            "devise": body.currency,
            "quantite": body.quantity,
            "uniteQuantite": body.quantityUnit,
            "certifications": json.dumps(body.certifications or []),
            "dateLimite": deadline_dt,
            "statut": "active",
            "publishedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
        },
    )
    full = await prisma.annonce.find_unique(
        where={"id": annonce.id},
        include={
            "utilisateur": {"include": {"entreprise": {"include": {"location": True}}}},
            "categorie": True,
            "locationOrigine": True,
            "documents": True,
            "incotermeAnnonces": {"include": {"incoterme": True}},
        },
    )
    return serialize_listing(full)


@router.put("/{id}")
async def update_listing(id: str, body: ListingUpdateRequest, user=Depends(get_current_user)):
    existing = await prisma.annonce.find_unique(where={"id": id})
    if not existing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if existing.utilisateurId != user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")

    data = {}
    if body.product is not None or body.title is not None:
        data["titre"] = body.product or body.title
    if body.description is not None:
        data["description"] = body.description
    if body.type is not None:
        data["type"] = body.type if body.type in ("offer", "demand") else body.type
    if body.price is not None:
        data["prix"] = body.price
    if body.currency is not None:
        data["devise"] = body.currency
    if body.quantity is not None:
        data["quantite"] = body.quantity
    if body.quantityUnit is not None:
        data["uniteQuantite"] = body.quantityUnit
    if body.certifications is not None:
        data["certifications"] = json.dumps(body.certifications)
    if body.deadline is not None:
        try:
            from datetime import datetime, timezone
            data["dateLimite"] = datetime.fromisoformat(body.deadline + "T23:59:59Z").replace(tzinfo=timezone.utc) if body.deadline else None
        except (ValueError, TypeError):
            data["dateLimite"] = None
    if body.status is not None:
        data["statut"] = body.status

    await prisma.annonce.update(where={"id": id}, data=data)
    full = await prisma.annonce.find_unique(
        where={"id": id},
        include={
            "utilisateur": {"include": {"entreprise": {"include": {"location": True}}}},
            "categorie": True,
            "locationOrigine": True,
            "documents": True,
            "incotermeAnnonces": {"include": {"incoterme": True}},
        },
    )
    return serialize_listing(full)


@router.delete("/{id}")
async def delete_listing(id: str, user=Depends(get_current_user)):
    existing = await prisma.annonce.find_unique(where={"id": id})
    if not existing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if existing.utilisateurId != user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")

    await prisma.annonce.delete(where={"id": id})
    return {"success": True}
