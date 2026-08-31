import pytest
from app.services.logistics_service import LogisticsService

def test_haversine_distance():
    service = LogisticsService()
    # Test between Maroc and Canada as requested in previous sessions
    # Maroc: 31.5, -9.5 (approx)
    # Canada: 56.0, -106.0 (approx)
    dist = service.haversine_distance(31.5, -9.5, 56.0, -106.0)
    assert dist > 7000 and dist < 8000 # ~7800 km

def test_calculate_route_mocked(monkeypatch):
    service = LogisticsService()
    
    # Mock geocode to return static coordinates
    def mock_geocode(country_name):
        if country_name == "Maroc":
            return 31.5, -9.5
        if country_name == "Canada":
            return 56.0, -106.0
        return None, None
        
    monkeypatch.setattr(service, "get_country_coordinates", mock_geocode)
    
    # Fallback to haversine
    result = service.calculate_route("Maroc", "Canada")
    assert result is not None
    assert "distance_km" in result
    assert result["distance_km"] > 7000
    assert result["estimated_cost_usd"] > 0
    assert result["estimated_days"] > 0
