import json
from pathlib import Path
from app.models import Listing, ProfilEntreprise, DonneesLogistiques
from datetime import datetime, timezone


DATA_DIR = Path(__file__).parent / "data"
HISTORY_PATH = DATA_DIR / "match_history.json"

def get_annonces() -> list[Listing]:
    with open(DATA_DIR / "mock_listings.json", encoding="utf-8") as f:
        data = json.load(f)
    return [Listing(**item) for item in data]


def get_listing_by_id(listing_id: str) -> Listing | None:
    
    for listing in get_annonces():
        if listing.id == listing_id:
            return listing
    return None



def get_annonces_opposees(annonce: Listing) -> list[Listing]:
    type_oppose = "offre" if annonce.type == "demande" else "demande"
    toutes = get_annonces()
    return [a for a in toutes if a.type == type_oppose]


def get_profil_entreprise(entreprise_id: str) -> ProfilEntreprise | None:
    with open(DATA_DIR / "mock_entreprises.json", encoding="utf-8") as f:
        data = json.load(f)
    for item in data:
        if item["entreprise_id"] == entreprise_id:
            return ProfilEntreprise(**item)
    return None


def get_donnees_logistiques(pays_origine: str, pays_destination: str) -> DonneesLogistiques | None:
    with open(DATA_DIR / "mock_logistique.json", encoding="utf-8") as f:
        data = json.load(f)
    for item in data:
        if item["pays_origine"] == pays_origine and item["pays_destination"] == pays_destination:
            return DonneesLogistiques(**item)
    return None

def enregistrer_match(match_result: dict) -> None:
    if HISTORY_PATH.exists():
        with open(HISTORY_PATH, encoding="utf-8") as f:
            historique = json.load(f)
    else:
        historique = []

    match_result["timestamp"] = datetime.now(timezone.utc).isoformat()
    match_result["status"] = "propose"

    historique.append(match_result)

    with open(HISTORY_PATH , "w", encoding="utf-8") as f:
        json.dump(historique, f, ensure_ascii=False,indent=2)