"""Test de régression pour vérifier que les données logistiques sont enrichies quand
les deux pays (origine et destination) sont fournis."""

import json

def test_create_listing_with_both_countries_enriches_logistics(client, registered_user, mock_logistics):
    """Quand une annonce est créée avec pays_origine ET pays_destination,
    les données logistiques doivent être enrichies."""
    payload = {
        "titre": "Export dattes avec logistique",
        "type": "offre",
        "categorie": "Agroalimentaire",
        "quantite": 100,
        "prix": 500,
        "devise": "USD",
        "pays_origine": "MA",  # Maroc
        "pays_destination": "IT",  # Italie
        "incoterm": "FOB",
        "documents": [],
    }
    r = client.post("/api/listings", json=payload, headers=registered_user["headers"])
    assert r.status_code == 201
    data = r.json()
    
    # Les données logistiques doivent être calculées
    assert data["distance_km"] is not None
    assert data["estimated_cost_usd"] is not None
    assert data["estimated_days"] is not None
    assert data["distance_km"] > 0
    assert data["estimated_cost_usd"] > 0
    assert data["estimated_days"] > 0


def test_currency_defaults_to_usd_when_missing(client, registered_user, mock_logistics):
    """Quand aucune devise n'est fournie, elle doit par défaut être USD."""
    payload = {
        "titre": "Produit sans devise",
        "type": "offre",
        "categorie": "Textile",
        "quantite": 50,
        "prix": 300,
        # Pas de devise fournie
        "pays_origine": "TN",
        "pays_destination": "FR",
        "incoterm": "CIF",
        "documents": [],
    }
    r = client.post("/api/listings", json=payload, headers=registered_user["headers"])
    assert r.status_code == 201
    data = r.json()
    
    # Doit avoir une devise par défaut
    assert data.get("currency") == "USD" or data.get("devise") == "USD"
    assert data.get("currency") is not None


def test_category_filter_case_insensitive(client, registered_user, mock_logistics):
    """Le filtre catégorie doit être insensible à la casse."""
    # Créer une annonce avec catégorie "Textile"
    client.post("/api/listings", json={
        "titre": "Coton premium",
        "type": "offre",
        "categorie": "Textile",
        "quantite": 100,
        "prix": 500,
        "devise": "USD",
        "pays_origine": "TN",
        "pays_destination": "FR",
        "incoterm": "FOB",
        "documents": [],
    }, headers=registered_user["headers"])

    # Chercher avec casse différente (minuscules)
    r = client.get("/api/listings/search?categorie=textile")
    assert r.status_code == 200
    results = r.json()["annonces"]
    assert len(results) >= 1
    assert any("textile" in a.get("category", "").lower() for a in results)


def test_listing_response_always_includes_currency_field(client, registered_user, mock_logistics):
    """Chaque annonce renvoyée doit toujours avoir un champ currency non-null."""
    # Créer une annonce
    r = client.post("/api/listings", json={
        "titre": "Test devise",
        "type": "offre",
        "categorie": "Agroalimentaire",
        "quantite": 50,
        "prix": 100,
        "devise": "EUR",
        "pays_origine": "FR",
        "pays_destination": "BE",
        "incoterm": "FOB",
        "documents": [],
    }, headers=registered_user["headers"])
    listing_id = r.json()["id"]

    # Récupérer la liste et vérifier
    r = client.get("/api/listings")
    assert r.status_code == 200
    annonces = r.json() if isinstance(r.json(), list) else r.json().get("annonces", [])
    
    for annonce in annonces:
        assert annonce.get("currency") is not None, f"Annonce {annonce.get('id')} n'a pas de currency"
