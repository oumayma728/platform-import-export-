"""Contrats de base à lancer après recréation de l'environnement virtuel."""
from app.services.logistics_service import estimate


def test_logistics_estimate_returns_positive_values():
    result = estimate("NG", "FR")
    assert result["distance_km"] > 0
    assert result["estimated_cost_usd"] > 0
