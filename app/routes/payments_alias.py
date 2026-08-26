from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import verify_token
from app.schemas.billing import PaymentIntentCreate
from app.routes.billing import payment_intent

router = APIRouter(prefix="/payments", tags=["Paiements"])

@router.post("/create-intent")
def create_intent_alias(
    data: PaymentIntentCreate,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    return payment_intent(
        data=data,
        user=user,
        db=db,
    )