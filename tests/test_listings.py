"""Tests du module annonces : création, lecture, modification, recherche, enrichissement."""


def _payload_annonce(**overrides):
    base = {
        "titre": "Export dattes Deglet Nour",
        "description": "Dattes premium calibre extra",
        "type": "offre",
        "categorie": "Agroalimentaire",
        "quantite": 500,
        "prix": 2500,
        "devise": "TND",
        "pays_origine": "TN",
        "pays_destination": "FR",
        "incoterm": "FOB",
        "documents": [],
    }
    base.update(overrides)
    return base


def test_create_listing(client, registered_user, mock_logistics):
    r = client.post("/api/listings", json=_payload_annonce(), headers=registered_user["headers"])
    assert r.status_code == 201
    data = r.json()
    assert data["titre"] == "Export dattes Deglet Nour"
    assert data["user_id"] == registered_user["id"]
    # L'enrichissement logistique doit avoir été appelé et le résultat stocké
    assert data["distance_km"] == 1500.0
    mock_logistics.assert_called_once()


def test_create_listing_necessite_authentification(client, mock_logistics):
    r = client.post("/api/listings", json=_payload_annonce())
    assert r.status_code == 401


def test_create_listing_sans_pays_pas_denrichissement(client, registered_user, mock_logistics):
    payload = _payload_annonce()
    payload.pop("pays_origine")
    payload.pop("pays_destination")
    r = client.post("/api/listings", json=payload, headers=registered_user["headers"])
    assert r.status_code == 201
    assert r.json()["distance_km"] is None
    mock_logistics.assert_not_called()


def test_create_listing_pays_invalide_rejete_par_schema(client, registered_user, mock_logistics):
    payload = _payload_annonce(pays_origine="Tunisie", pays_destination="France")
    r = client.post("/api/listings", json=payload, headers=registered_user["headers"])
    # Le format ISO alpha-2 est exigé au niveau du schéma (voir schemas/listing.py)
    assert r.status_code == 422


def test_get_listing_by_id(client, registered_user, mock_logistics):
    r = client.post("/api/listings", json=_payload_annonce(), headers=registered_user["headers"])
    listing_id = r.json()["id"]

    r2 = client.get(f"/api/listings/{listing_id}")
    assert r2.status_code == 200
    assert r2.json()["id"] == listing_id


def test_get_listing_introuvable(client):
    r = client.get("/api/listings/999999")
    assert r.status_code == 404


def test_update_listing(client, registered_user, mock_logistics):
    r = client.post("/api/listings", json=_payload_annonce(), headers=registered_user["headers"])
    listing_id = r.json()["id"]

    r2 = client.put(f"/api/listings/{listing_id}", json={"prix": 3000}, headers=registered_user["headers"])
    assert r2.status_code == 200
    assert r2.json()["prix"] == 3000


def test_update_listing_par_un_autre_utilisateur_refuse(client, registered_user, second_user, mock_logistics):
    r = client.post("/api/listings", json=_payload_annonce(), headers=registered_user["headers"])
    listing_id = r.json()["id"]

    r2 = client.put(f"/api/listings/{listing_id}", json={"prix": 1}, headers=second_user["headers"])
    assert r2.status_code == 403


def test_suspend_and_resume_listing(client, registered_user, mock_logistics):
    r = client.post("/api/listings", json=_payload_annonce(), headers=registered_user["headers"])
    listing_id = r.json()["id"]

    r2 = client.patch(f"/api/listings/{listing_id}/suspend", headers=registered_user["headers"])
    assert r2.status_code == 200
    assert r2.json()["suspendue"] is True

    r3 = client.patch(f"/api/listings/{listing_id}/resume", headers=registered_user["headers"])
    assert r3.status_code == 200
    assert r3.json()["suspendue"] is False


def test_search_listings_route_atteignable(client):
    """Non-régression : /search était auparavant intercepté par /{listing_id} et
    renvoyait systématiquement 422 (bug de routage corrigé)."""
    r = client.get("/api/listings/search?country=FR")
    assert r.status_code == 200


def test_search_listings_filtre_par_categorie(client, registered_user, mock_logistics):
    client.post("/api/listings", json=_payload_annonce(categorie="Textile"), headers=registered_user["headers"])
    client.post("/api/listings", json=_payload_annonce(categorie="Agroalimentaire"), headers=registered_user["headers"])

    r = client.get("/api/listings/search?categorie=Textile")
    assert r.status_code == 200
    assert all(a["categorie"] == "Textile" for a in r.json()["annonces"])


def test_search_listings_conversion_devise(client, registered_user, mock_logistics, mock_currency):
    r = client.post("/api/listings", json=_payload_annonce(prix=1000, devise="TND"), headers=registered_user["headers"])
    listing_id = r.json()["id"]

    r2 = client.get("/api/listings/search?devise_affichage=EUR")
    assert r2.status_code == 200
    annonce = next(a for a in r2.json()["annonces"] if a["id"] == listing_id)
    assert annonce["prix"] == 1000  # le prix original n'est jamais modifié
    assert annonce["devise"] == "TND"
    assert annonce["prix_converti"] == 320.0  # 1000 * 0.32 (taux fictif du mock)
    assert annonce["devise_affichage"] == "EUR"
    mock_currency.assert_called()