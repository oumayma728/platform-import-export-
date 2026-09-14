from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from app.config.database import get_db
from app.models.models import Company, TypeCompany
from app.schemas.identity import CompanyOut
from app.middleware.auth_middleware import get_current_user_optional

router = APIRouter()

@router.get("/search", response_model=List[CompanyOut], description="Rechercher une entreprise (exportateur ou importateur) par son nom ou son ID")
def search_companies(
    q: str = Query(None, description="Terme de recherche (nom ou id de l'entreprise)"),
    type: TypeCompany = Query(None, description="Filtrer par type (EXPORTATEUR ou IMPORTATEUR)"),
    db: Session = Depends(get_db)
):
    query = db.query(Company)
    
    if type:
        query = query.filter(Company.type == type)
        
    if q:
        # Search by ID or partial match on company_name
        query = query.filter(
            or_(
                Company.id == q,
                Company.company_name.ilike(f"%{q}%")
            )
        )
        
    companies = query.all()
    return companies
