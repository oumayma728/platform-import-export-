"""
stats.py — Statistiques pour les tableaux de bord (Dashboard)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Company, Stand, RendezVous, Conversation, Annonce
from ..routes.auth import get_current_user, require_role
from ..schemas import UserRead

router = APIRouter()


@router.get("/exporter")
def get_exporter_stats(
    current_user: UserRead = Depends(require_role("exporter", "admin")),
    db: Session = Depends(get_db),
):
    """Récupère les statistiques pour le dashboard d'un exportateur."""
    
    # 1. Identifier les entreprises de l'utilisateur
    companies = db.query(Company).filter(Company.owner_id == current_user.id).all()
    company_ids = [c.id for c in companies]

    if not company_ids:
        return {
            "total_stands": 0,
            "total_rdvs": 0,
            "total_conversations": 0,
            "total_ads": 0,
            "chart_data": [],
        }

    # 2. Compter les métriques principales
    total_stands = db.query(Stand).filter(Stand.exporter_id.in_(company_ids)).count()
    
    total_rdvs = db.query(RendezVous).filter(RendezVous.exporter_id.in_(company_ids)).count()
    
    total_ads = db.query(Annonce).filter(Annonce.company_id.in_(company_ids)).count()
    
    # Pour les conversations, on passe par les stands de l'entreprise
    stands = db.query(Stand).filter(Stand.exporter_id.in_(company_ids)).all()
    stand_ids = [s.id for s in stands]
    
    if stand_ids:
        total_conversations = db.query(Conversation).filter(Conversation.stand_id.in_(stand_ids)).count()
    else:
        total_conversations = 0

    # 3. Données graphiques mockées (historique des vues ou visites par mois)
    # Dans un vrai système, on aurait une table "Analytics" ou "Visits".
    chart_data = [
        {"name": "Jan", "visites": 40, "contacts": 24},
        {"name": "Fév", "visites": 30, "contacts": 13},
        {"name": "Mar", "visites": 20, "contacts": 98},
        {"name": "Avr", "visites": 27, "contacts": 39},
        {"name": "Mai", "visites": 18, "contacts": 48},
        {"name": "Juin", "visites": 23, "contacts": 38},
        {"name": "Juil", "visites": 34, "contacts": 43},
    ]

    return {
        "total_stands": total_stands,
        "total_rdvs": total_rdvs,
        "total_conversations": total_conversations,
        "total_ads": total_ads,
        "chart_data": chart_data,
    }
