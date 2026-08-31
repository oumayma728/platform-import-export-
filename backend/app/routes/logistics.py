from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any
from app.services.logistics_service import logistics_service

router = APIRouter(tags=["Logistics & Freight"])

@router.get("/estimate")
def estimate_freight_route(
    from_country: str = Query(..., alias="from", description="Pays d'origine (ex: Maroc)"),
    to_country: str = Query(..., alias="to", description="Pays de destination (ex: France)")
) -> Dict[str, Any]:
    if not from_country or not to_country:
        raise HTTPException(status_code=400, detail="Les pays d'origine et de destination sont obligatoires.")
        
    result = logistics_service.calculate_route(from_country, to_country)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
        
    return result
