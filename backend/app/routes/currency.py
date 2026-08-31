from fastapi import APIRouter, Query
from app.services.currency_service import currency_service
from typing import Dict, Any

router = APIRouter(tags=["Currency"])

@router.get("/convert")
def convert_currency(
    amount: float = Query(..., description="Amount to convert"),
    from_currency: str = Query(..., alias="from", description="Source currency code (e.g. EUR)"),
    to_currency: str = Query(..., alias="to", description="Target currency code (e.g. USD)")
) -> Dict[str, Any]:
    
    from_currency = from_currency.upper()
    to_currency = to_currency.upper()
    
    converted_amount = currency_service.convert(amount, from_currency, to_currency)
    
    return {
        "amount": amount,
        "from": from_currency,
        "to": to_currency,
        "converted_amount": converted_amount
    }
