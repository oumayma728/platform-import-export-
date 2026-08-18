"""
external.py — Routes pour les API externes : devises et logistique
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query

from ..routes.auth import get_current_user
from ..schemas import UserRead
from ..services.currency import CurrencyService
from ..services.logistics import LogisticsService, estimate_logistics

router = APIRouter()


@router.get("/currency/convert", response_model=dict, tags=["currency"])
async def convert_currency(
    amount: float = Query(..., description="Montant à convertir"),
    from_currency: str = Query("EUR", description="Devise source (ex: EUR)"),
    to_currency: str = Query("USD", description="Devise cible (ex: USD)"),
    current_user: UserRead = Depends(get_current_user),
):
    """Convertit un montant d'une devise à une autre."""
    if amount < 0:
        raise HTTPException(status_code=400, detail="Le montant doit être positif")
    if len(from_currency) != 3 or len(to_currency) != 3:
        raise HTTPException(status_code=400, detail="Les codes de devise doivent être sur 3 lettres (ex: EUR, USD)")

    result = await CurrencyService.convert(amount, from_currency, to_currency)
    if not result:
        raise HTTPException(
            status_code=503,
            detail=f"Impossible de récupérer le taux de change {from_currency}/{to_currency}",
        )
    return result


@router.get("/currency/rates", response_model=dict, tags=["currency"])
async def get_rates(
    base: str = Query("EUR", description="Devise de base"),
    current_user: UserRead = Depends(get_current_user),
):
    """Retourne tous les taux de change pour une devise de base."""
    rates = await CurrencyService.get_all_rates(base)
    if not rates:
        raise HTTPException(status_code=503, detail="Service de change temporairement indisponible")
    return {"base": base.upper(), "rates": rates}


@router.get("/logistics/estimate", response_model=dict, tags=["logistics"])
async def logistics_estimate(
    from_country: Optional[str] = Query(None, alias="from", description="Code ISO 2 du pays d'origine (ex: FR)"),
    from_country_alt: Optional[str] = Query(None, alias="from_country", description="Code ISO 2 alternatif"),
    to_country: Optional[str] = Query(None, alias="to", description="Code ISO 2 du pays de destination (ex: MA)"),
    to_country_alt: Optional[str] = Query(None, alias="to_country", description="Code ISO 2 alternatif"),
    weight_kg: float = Query(1000.0, description="Poids de la marchandise en kg"),
    incoterm: Optional[str] = Query("FOB", description="Code Incoterm (FOB, CIF, EXW, DDP...)"),
    current_user: UserRead = Depends(get_current_user),
):
    """
    Estime la distance, le coût (USD & EUR) et le délai de transport entre deux pays.
    Prend en compte les Incoterms et la géolocalisation.
    """
    origin = from_country or from_country_alt
    destination = to_country or to_country_alt

    if not origin or not destination:
        raise HTTPException(
            status_code=400,
            detail="Les paramètres de pays d'origine ('from' ou 'from_country') et de destination ('to' ou 'to_country') sont requis."
        )

    if weight_kg <= 0:
        raise HTTPException(status_code=400, detail="Le poids doit être positif")

    result = await LogisticsService.calculate_route(
        origin_country=origin,
        destination_country=destination,
        weight_kg=weight_kg,
        incoterm=incoterm or "FOB"
    )

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    return result
