from datetime import date
from app.models import Listing, ProfilEntreprise, DonneesLogistiques
from app.scoring import (
    score_produit,
    score_prix_quantite,
    score_geo_logistique,
    score_fiabilite,
    score_delais,
    calculer_score_global,
)

def _annonce(**overrides):
    
    defaults = dict(
        id="TEST001",
        type="offre",
        produit="jeans",
        categorie="vetements",
        prix_unitaire=10.0,
        quantite=1000,
        pays="Maroc",
        date_disponibilite=None,
        date_limite=None,
        entreprise_id="ENT_TEST",
    )
    defaults.update(overrides)
    return Listing(**defaults)




def test_score_produit_match_exact():
    a = _annonce(produit="jeans")
    b = _annonce(produit="jeans")
    assert score_produit(a, b) == 1.0


def test_score_produit_synonyme_proche():
    a = _annonce(produit="jeans")
    b = _annonce(produit="pantalons denim")
    score = score_produit(a, b)
    assert 0.5 < score < 1.0


def test_score_produit_categories_differentes():
    a = _annonce(produit="jeans")
    b = _annonce(produit="ordinateurs portables")
    score = score_produit(a, b)
    assert score < 0.5




def test_score_prix_quantite_identiques():
    a = _annonce(prix_unitaire=10.0, quantite=1000)
    b = _annonce(prix_unitaire=10.0, quantite=1000)
    assert score_prix_quantite(a, b) == 1.0


def test_score_prix_quantite_ecart_important():
    a = _annonce(prix_unitaire=10.0, quantite=1000)
    b = _annonce(prix_unitaire=100.0, quantite=10)
    score = score_prix_quantite(a, b)
    assert score < 0.3




def test_score_geo_logistique_donnee_manquante():
    assert score_geo_logistique(None) == 0.5


def test_score_geo_logistique_valeurs_favorables():
    logistique = DonneesLogistiques(
        pays_origine="Maroc", pays_destination="Tunisie",
        distance_km=100, cout_transport=50, delai_transport_jours=1,
    )
    score = score_geo_logistique(logistique)
    assert score > 0.9




def test_score_fiabilite_donnee_manquante():
    assert score_fiabilite(None) == 0.3


def test_score_fiabilite_profil_connu():
    profil = ProfilEntreprise(entreprise_id="ENT001", reputation_score=0.9)
    assert score_fiabilite(profil) == 0.9




def test_score_delais_donnee_manquante():
    a = _annonce(date_disponibilite=None)
    b = _annonce(date_limite=None)
    assert score_delais(a, b) == 0.5


def test_score_delais_incompatible():
    offre = _annonce(date_disponibilite=date(2026, 9, 15))
    demande = _annonce(date_limite=date(2026, 9, 1))
    assert score_delais(offre, demande) == 0.0


def test_score_delais_marge_confortable():
    offre = _annonce(date_disponibilite=date(2026, 8, 1))
    demande = _annonce(date_limite=date(2026, 9, 15))
    assert score_delais(offre, demande) == 1.0


def test_score_delais_marge_faible():
    offre = _annonce(date_disponibilite=date(2026, 8, 20))
    demande = _annonce(date_limite=date(2026, 9, 1))
    score = score_delais(offre, demande)
    assert score == 0.82




def test_calculer_score_global_structure():
    offre = _annonce(type="offre")
    demande = _annonce(type="demande")
    profil = ProfilEntreprise(entreprise_id="ENT_TEST", reputation_score=0.8)

    resultat = calculer_score_global(demande, offre, profil, None)

    assert 0.0 <= resultat.score_global <= 1.0
    assert set(resultat.detail_scores.keys()) == {
        "produit", "prix_quantite", "geo_logistique", "fiabilite", "delais"
    }