"""Contrats de base à lancer après recréation de l'environnement virtuel."""
import asyncio
from unittest.mock import patch
from app.services.logistics_service import estimate


def test_logistics_estimate_returns_positive_values():
    with patch(
        "app.services.logistics_service._fetch_country_coords",
        side_effect=lambda code: {"NG": (9.08, 8.68), "FR": (46.23, 2.21)}[code],
    ):
        result = asyncio.run(estimate("NG", "FR"))

    assert result["distance_km"] > 0
    assert result["estimated_cost_usd"] > 0
    assert result["estimated_days"] > 0