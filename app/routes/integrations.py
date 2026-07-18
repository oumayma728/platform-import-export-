from fastapi import APIRouter, HTTPException, Query
from app.services.currency_service import convert
from app.services.logistics_service import estimate

router = APIRouter(tags=["Intégrations"])

@router.get(
    "/currency/convert",
    summary="Convertir un prix",
    description="Convertir une somme d'une devise à une autre.",
)
async def currency_convert(amount: float = Query(gt=0), from_currency: str = Query(alias="from"), to_currency: str = Query(alias="to")):
    try:
        return await convert(amount, from_currency, to_currency)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get(
    "/logistics/estimate",
    summary="Estimer un transport entre deux pays",
    description="Estimer le coût logistique entre deux pays.",
)
def logistics_estimate(origin: str = Query(alias="from"), destination: str = Query(alias="to")):
    try:
        return estimate(origin, destination)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
