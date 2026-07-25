from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import User, Company, Listing, StatutValidation, StatutListing

def change_company_status(db: Session, company_id: str, new_status: StatutValidation) -> Company:
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company introuvable")
    company.statut_validation = new_status
    db.commit()
    db.refresh(company)
    return company

def change_listing_status(db: Session, listing_id: str, new_status: StatutListing) -> Listing:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing introuvable")
    listing.statut = new_status
    db.commit()
    db.refresh(listing)
    return listing
