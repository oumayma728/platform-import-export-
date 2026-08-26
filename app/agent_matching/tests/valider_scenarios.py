from tests.fixtures.listings_mockes import LISTINGS_MOCKES
from models.schemas import TypeListing 
from services.scoring import scoring_global
from services.scoring import matching_exact

def test_scenario(id_demande: str):
    demande = next(l for l in LISTINGS_MOCKES if l.id == id_demande)
    offres = [l for l in LISTINGS_MOCKES if l.type == TypeListing.offre]

    resultats = []
    for offre in offres:
        r = scoring_global(demande, offre)
        
        # Détermine le niveau de priorité produit
        if matching_exact(offre.produit, demande.produit):
            priorite = 2
        elif offre.categorie.strip().lower() == demande.categorie.strip().lower():
            priorite = 1
        else:
            priorite = 0
        
        resultats.append((priorite, r))

    # Trie d'abord par priorité (décroissant), puis par score dans chaque groupe
    resultats.sort(key=lambda x: (x[0], x[1].score_global), reverse=True)

    print(f"\n=== Scénario : {id_demande} ({demande.produit}, {demande.pays}) ===")
    for priorite, r in resultats[:3]:
        print(f"  {r.listing_id} -> {r.score_global}  (priorité produit: {priorite})")


# Liste des scénarios à tester
test_scenario("demande-001")
test_scenario("demande-002")
test_scenario("demande-003")
test_scenario("demande-004")
test_scenario("demande-005")
test_scenario("demande-006")
test_scenario("demande-008")
test_scenario("demande-009")
test_scenario("demande-010")