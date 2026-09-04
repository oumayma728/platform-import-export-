from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import verify_token
from app.routes.billing import get_invoices, get_invoice

router = APIRouter(prefix="/invoices", tags=["Paiements"])


@router.get("", summary="Lister les factures de l'utilisateur (alias)")
def get_invoices_alias(
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    return get_invoices(user=user, db=db)


@router.get("/{invoice_id}", summary="Détail d'une facture (alias)")
def get_invoice_alias(
    invoice_id: str,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    return get_invoice(invoice_id=invoice_id, user=user, db=db)