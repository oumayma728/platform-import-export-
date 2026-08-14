"""Script manuel pour tester plusieurs scénarios de matching et inspecter les résultats.
Usage : python -m tests.manual_scenarios
"""
from app.mock_client import get_listing_by_id, get_annonces_opposees
from app.scoring import calcul_score_global

SCENARIOS = [
    ("D001", "Jeans (excellent match attendu)"),
    ("D002", "T-shirts coton (bon match attendu)"),
    ("D003", "Baskets running (match moyen attendu, categorie proche)"),
    ("D004", "Telephones occasion (bon match attendu)"),
    ("D005", "Ecouteurs bluetooth (test delai serre)"),
    ("D006", "Chemises coton (match partiel attendu)"),
    ("D007", "Coton brut (excellent match attendu)"),
    ("D008", "Meubles en bois (mauvais match attendu, aucune offre du secteur)"),
    ("D009", "Casquettes personnalisees (match partiel attendu)"),
    ("D010", "Ordinateurs occasion (bon match attendu)"),
]

for listing_id, description in SCENARIOS:
    print(f"\n{'='*70}")
    print(f"Scenario : {listing_id} - {description}")
    print('='*70)

    listing_source = get_listing_by_id(listing_id)
    if listing_source is None:
        print(f"  Listing {listing_id} introuvable !")
        continue

    candidats = get_annonces_opposees(listing_source)
    resultats = []
    for candidat in candidats:
        if listing_source.type == "offre":
            resultat = calcul_score_global(candidat, listing_source)
        else:
            resultat = calcul_score_global(listing_source, candidat)
        resultats.append(resultat)

    resultats.sort(key=lambda r: r.score_global, reverse=True)
    top3 = resultats[:3]

    for i, r in enumerate(top3, start=1):
        print(f"  #{i} - {r.listing_id} - score: {r.score_global}")
        print(f"      {r.explication}")