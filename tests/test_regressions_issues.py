"""Test régressions pour les trois problèmes : distance, devise, filtrage catégorie."""

def test_search_listings_filtre_categorie_case_insensitive(client, registered_user, mock_logistics):
    """Le filtre catégorie doit être insensible à la casse."""
    # Créer deux annonces avec la même catégorie, mais des cas différentes en DB est
    # une erreur de données, mais quand on cherche, on doit trouver les deux.
    client.post("/api/listings", json={
        "titre": "Export coton premium",
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
    
    client.post("/api/listings", json={
        "titre": "Soie brute",
        "type": "offre",
        "categorie": "Textile",
        "quantite": 50,
        "prix": 800,
        "devise": "USD",
        "pays_origine": "TN",
        "pays_destination": "FR",
        "incoterm": "FOB",
        "documents": [],
    }, headers=registered_user["headers"])

    # Chercher en minuscules
    r = client.get("/api/listings/search?categorie=textile")
    assert r.status_code == 200
    results = r.json()["annonces"]
    assert len(results) >= 2
    assert all(a["category"].lower() == "textile" for a in results)


def test_search_listings_distance_missing_when_no_countries(client, registered_user, mock_logistics):
    """Quand pays_origine ou pays_destination sont manquants, distance doit être NULL."""
    payload = {
        "titre": "Produit sans pays",
        "type": "offre",
        "categorie": "Divers",
        "quantite": 100,
        "prix": 500,
        "devise": "USD",
        # Pas de pays_origine, pas de pays_destination
        "incoterm": "FOB",
        "documents": [],
    }
    r = client.post("/api/listings", json=payload, headers=registered_user["headers"])
    assert r.status_code == 201
    data = r.json()
    assert data["distance_km"] is None
    assert data["estimated_cost_usd"] is None
    assert data["estimated_days"] is None


def test_search_listings_currency_always_present(client, registered_user, mock_logistics):
    """La devise doit toujours être présente, même si non fournie (par défaut USD)."""
    # Créer sans devise explicite
    payload = {
        "titre": "Produit sans devise explicite",
        "type": "offre",
        "categorie": "Agroalimentaire",
        "quantite": 100,
        "prix": 500,
        # Pas de devise fournie
        "pays_origine": "TN",
        "pays_destination": "FR",
        "incoterm": "FOB",
        "documents": [],
    }
    r = client.post("/api/listings", json=payload, headers=registered_user["headers"])
    assert r.status_code == 201
    data = r.json()
    # Doit avoir une devise (par défaut USD)
    assert data["currency"] is not None
    assert data["devise"] is not None or data["currency"] == "USD"
