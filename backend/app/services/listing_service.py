from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional, List
import json

from app.models.models import Listing, User, StatutListing, StatutValidation, Role
from app.schemas.listing import ListingCreate, ListingUpdate

def create_listing(db: Session, listing_in: ListingCreate, current_user: User) -> Listing:
    if not current_user.company:
        raise HTTPException(status_code=401, detail="Vous n'avez pas de company associée.")
    
    if current_user.company.statut_validation != StatutValidation.VALIDE:
        raise HTTPException(status_code=403, detail="Votre profil est en attente de validation par l'Administrateur. Vous ne pouvez pas créer d'annonce.")
    
    docs_json = json.dumps(listing_in.documents_urls) if listing_in.documents_urls else ""
    
    new_listing = Listing(
        company_id=current_user.company.id,
        type=listing_in.type,
        titre=listing_in.titre,
        description=listing_in.description,
        categorie=listing_in.categorie,
        prix=listing_in.prix,
        quantite=listing_in.quantite,
        pays=listing_in.pays,
        incoterms=listing_in.incoterms,
        delai_livraison=listing_in.delai_livraison,
        certification=listing_in.certification,
        documents_urls=docs_json
    )
    
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return new_listing

def get_listing(db: Session, id: str) -> Listing:
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing introuvable")
    return listing

def update_listing(db: Session, id: str, listing_in: ListingUpdate, current_user: User) -> Listing:
    if not current_user.company:
        raise HTTPException(status_code=401, detail="Vous n'avez pas de company associée.")
    
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing introuvable")
    
    if not current_user.company or listing.company_id != current_user.company.id:
        raise HTTPException(status_code=403, detail="Non autorisé à modifier ce listing")

    update_data = listing_in.model_dump(exclude_unset=True)
    if 'documents_urls' in update_data:
        update_data['documents_urls'] = json.dumps(update_data['documents_urls'])
        
    for key, value in update_data.items():
        setattr(listing, key, value)
        
    db.commit()
    db.refresh(listing)
    return listing

def delete_listing(db: Session, id: str, current_user: User):
    if not current_user.company and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=401, detail="Vous n'avez pas de company associée.")
    
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing introuvable")
        
    if current_user.role != Role.ADMIN and (not current_user.company or listing.company_id != current_user.company.id):
        raise HTTPException(status_code=403, detail="Non autorisé à supprimer ce listing")

    db.delete(listing)
    db.commit()
    return {"message": "Listing supprimé avec succès"}

def close_listing(db: Session, id: str, current_user: User) -> Listing:
    if not current_user.company and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=401, detail="Vous n'avez pas de company associée.")
    
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing introuvable")
        
    if current_user.role != Role.ADMIN and (not current_user.company or listing.company_id != current_user.company.id):
        raise HTTPException(status_code=403, detail="Non autorisé à modifier ce listing")

    listing.statut = StatutListing.CLOTUREE
    db.commit()
    db.refresh(listing)
    return listing

def search_listings(
    db: Session,
    pays: Optional[str] = None,
    categorie: Optional[str] = None,
    prixMin: Optional[float] = None,
    prixMax: Optional[float] = None,
    certification: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> List[Listing]:
    query = db.query(Listing).filter(Listing.statut == StatutListing.ACTIVE)
    if pays:
        query = query.filter(Listing.pays.ilike(f"%{pays}%"))
    if categorie:
        query = query.filter(Listing.categorie.ilike(f"%{categorie}%"))
    if certification:
        query = query.filter(Listing.certification.ilike(f"%{certification}%"))
    if prixMin is not None:
        query = query.filter(Listing.prix >= prixMin)
    if prixMax is not None:
        query = query.filter(Listing.prix <= prixMax)
        
    return query.order_by(Listing.date_creation.desc()).offset(skip).limit(limit).all()

def get_my_listings(db: Session, current_user: User) -> List[Listing]:
    if not current_user.company:
        return []
    return db.query(Listing).filter(Listing.company_id == current_user.company.id).order_by(Listing.date_creation.desc()).all()
