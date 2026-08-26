from datetime import date
from app.matching.models import Listing, ProfilEntreprise, DonneesLogistiques, MatchResult, MatchingCriteria
#from sentence_transformers import SentenceTransformer
from difflib import SequenceMatcher
from rapidfuzz import fuzz
from app.matching.mock_client import get_profil_entreprise, get_donnees_logistiques

#_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")


POIDS_GLOBAL = {
    "produit": 0.25,
    "prix_quantite": 0.25,
    "geo_logistique": 0.25,
    "fiabilite": 0.15,
    "delais": 0.10,
}

POIDS_PRODUIT = {
    "nom": 0.7,       # importance du nom du produit (exact ou fuzzy)
    "categorie": 0.3,  # importance de la catégorie
}
POIDS_GEO_LOGISTIQUE = {
    "distance": 0.30,
    "cout": 0.35,
    "delai": 0.35,
}
CERTIFICATIONS_RECONNUES = {
    "ISO 9001": 1.0,
    "ISO 14001": 0.8,
    "OEKO-TEX": 0.9,
    "GOTS": 0.9,
    "Fair Trade": 0.85,
}
NB_TRANSACTIONS_MAX = 50  # au-delà, considéré comme historique excellent

POIDS_FIABILITE = {
    "reputation": 0.50,
    "certifications": 0.30,
    "historique": 0.20,
}


def match_exact(listing_offre: Listing, listing_demande: Listing) -> int:
    return int(listing_offre.produit.strip().lower() == listing_demande.produit.strip().lower())

def score_fuzzy(listing_offre: Listing, listing_demande: Listing) -> float:
    """Score de similarité textuelle entre 0 et 1, tolérant aux variations de formulation."""
    ratio = fuzz.token_sort_ratio(listing_offre.produit.lower() , listing_demande.produit.lower())
    return ratio / 100

def score_categorie(listing_offre: Listing, listing_demande: Listing) -> float:
    """Retourne 1.0 si même catégorie, 0.0 sinon."""
    return 1.0 if listing_offre.categorie.strip().lower() == listing_demande.categorie.strip().lower() else 0.0

def score_produit(listing_a: Listing, listing_b: Listing) -> float:
    """Combine matching exact/fuzzy sur le nom du produit + validation de catégorie."""
    if match_exact(listing_a, listing_b):
        score_nom = 1.0
    else:
        score_nom = score_fuzzy(listing_a, listing_b)

    score_cat = score_categorie(listing_a, listing_b)

    return score_nom * POIDS_PRODUIT["nom"] + score_cat * POIDS_PRODUIT["categorie"]





def score_prix_quantite(offre: Listing, demande: Listing) -> float:
    
    # 1. SCORE PRIX (tolérance ±15%)
    prix_offre = offre.prix_unitaire
    budget_max = demande.prix_unitaire  # On suppose que c'est le budget max du demandeur
    
    # Si budget_max est 0, on retourne 0 (ou on gère proprement)
    if budget_max <= 0:
        return 0.0
    
    # Calcul du rapport prix_offre / budget_max
    rapport_prix = prix_offre / budget_max
    
    # Tolérance : prix_offre peut dépasser budget_max jusqu'à +15%
    # Si rapport <= 1.0 -> score = 1.0
    # Si 1.0 < rapport <= 1.15 -> score décroît linéairement de 1.0 à 0.0
    # Si rapport > 1.15 -> score = 0.0
    if rapport_prix <= 1.0:
        score_prix = 1.0
    elif rapport_prix <= 1.15:
        # Décroissance linéaire : de 1.0 (à 1.0) à 0.0 (à 1.15)
        score_prix = 1.0 - (rapport_prix - 1.0) / 0.15
    else:
        score_prix = 0.0
    
    # 2. SCORE QUANTITÉ (tolérance -10%)
    quantite_offre = offre.quantite
    quantite_demande = demande.quantite
    
    # Si la demande est 0, on considère que c'est parfait (pas de contrainte)
    if quantite_demande <= 0:
        score_quantite = 1.0
    else:
        # Calcul du rapport quantite_offre / quantite_demande
        rapport_quantite = quantite_offre / quantite_demande
        
        # Tolérance : quantite_offre peut être inférieure jusqu'à -10%
        # Si rapport >= 1.0 -> score = 1.0
        # Si 0.9 <= rapport < 1.0 -> score = 1.0 (tolérance)
        # Si rapport < 0.9 -> score décroît linéairement de 1.0 (à 0.9) à 0.0 (à 0)
        if rapport_quantite >= 0.9:
            score_quantite = 1.0
        else:
            # Décroissance linéaire de 1.0 (à 0.9) à 0.0 (à 0)
            score_quantite = rapport_quantite / 0.9
    
    # 3. SCORE COMBINÉ (moyenne pondérée)
    poids_prix = 0.6
    poids_quantite = 0.4
    score_final = (poids_prix * score_prix) + (poids_quantite * score_quantite)
    
    # Arrondir à 3 décimales
    return round(score_final, 3)

def score_geo_logistique(logistique: DonneesLogistiques | None) -> float:

    if logistique is None:
        return 0.5 # neutre tant que la donnée manque

    score_distance = max(0.0, 1.0 - logistique.distance_km / 2000) # on suppose que max distance geog =2000km
    score_cout = max(0.0, 1 - logistique.cout_transport / 1500) # max cout = 1500$
    score_delai = max(0.0, 1 - logistique.delai_transport_jours / 60) # max jour = 60j
    return (
        score_distance * POIDS_GEO_LOGISTIQUE["distance"]
        + score_cout * POIDS_GEO_LOGISTIQUE["cout"]
        + score_delai * POIDS_GEO_LOGISTIQUE["delai"]
    )

def score_certifications(profil: ProfilEntreprise) -> float:
    #Score basé sur les certifications reconnues détenues par l'entreprise.Moyenne des poids des certifications valides, 0 si aucune.
    if not profil.certification:
        return 0.0

    poids_trouves = [
        CERTIFICATIONS_RECONNUES[cert]
        for cert in profil.certification
        if cert in CERTIFICATIONS_RECONNUES
    ]

    if not poids_trouves:
        return 0.0

    return min(1.0, sum(poids_trouves) / len(CERTIFICATIONS_RECONNUES) * 2)
 
def score_historique(profil: ProfilEntreprise) -> float:
    #Score basé sur le nombre de transactions passées, plafonné à 1.0.
    return min(1.0, profil.nb_transactions / NB_TRANSACTIONS_MAX)

def score_fiabilite(profil: ProfilEntreprise | None) -> float:
    if profil is None:
        return 0.3

    score_rep = profil.reputation_score
    score_cert = score_certifications(profil)      
    score_hist = score_historique(profil)           

    return (
        score_rep * POIDS_FIABILITE["reputation"]
        + score_cert * POIDS_FIABILITE["certifications"]
        + score_hist * POIDS_FIABILITE["historique"]
    )

def comparer_delais(listing_offre: Listing, listing_demande: Listing) -> int:
    #Retourne le nombre de jours de dépassement (positif = en retard, négatif ou 0 = à temps).
    if listing_offre.date_disponibilite is None or listing_demande.date_limite is None:
        return None  # donnée manquante, géré séparément

    return (listing_offre.date_disponibilite - listing_demande.date_limite).days

def score_delais(listing_offre: Listing, listing_demande: Listing) -> float:
    """Score de compatibilité des délais avec tolérance dégressive :
    - à temps (dépassement <= 0) -> 1.0
    - dépassement 1-7 jours -> 1.0 (tolérance totale)
    - dépassement 7-14 jours -> 0.8
    - dépassement 14-30 jours -> 0.5
    - dépassement > 30 jours -> 0.0
    """
    if listing_offre.date_disponibilite is None or listing_demande.date_limite is None:
        return 0.5  # donnée manquante -> neutre

    depassement = (listing_offre.date_disponibilite - listing_demande.date_limite).days

    if depassement <= 7:
        return 1.0
    elif depassement <= 14:
        return 0.8
    elif depassement <= 30:
        return 0.5
    else:
        return 0.0


def generer_explication(criteria: MatchingCriteria) -> str:
    #Génère une phrase lisible résumant les points forts/faibles du match.
    parts = []

    if criteria.produit >= 0.9:
        parts.append("produit correspondant exactement")
    elif criteria.produit >= 0.5:
        parts.append("produit similaire")
    else:
        parts.append("produit peu correspondant")

    if criteria.prix_quantite >= 0.7:
        parts.append("prix et quantité compatibles")
    else:
        parts.append("écart de prix ou quantité important")

    if criteria.geo_logistique >= 0.7:
        parts.append("logistique favorable")
    else:
        parts.append("logistique coûteuse ou lente")

    if criteria.fiabilite >= 0.7:
        parts.append("partenaire fiable")
    else:
        parts.append("fiabilité du partenaire incertaine")

    if criteria.delais >= 0.7:
        parts.append("délais respectés avec marge confortable")
    elif criteria.delais > 0:
        parts.append("délais respectés de justesse")
    else:
        parts.append("délais incompatibles")

    return ", ".join(parts).capitalize() + "."






def calcul_score_global(
    listing_demande: Listing,
    listing_offre: Listing,
    profil: ProfilEntreprise | None = None,
    logistique: DonneesLogistiques | None = None,
) -> MatchResult:
    #Combine les 5 critères de scoring en un score global pondéré (0-100).
    # `profil`/`logistique` peuvent être fournis directement par l'appelant
    # (ex: intégration sur de vraies données) ; sinon, comportement inchangé
    # : on va les chercher via les données mockées comme avant.

    if profil is None:
        profil = get_profil_entreprise(listing_offre.entreprise_id)
    if logistique is None:
        logistique = get_donnees_logistiques(listing_offre.pays, listing_demande.pays)
    criteria = MatchingCriteria(
        produit=score_produit(listing_demande, listing_offre),
        prix_quantite=score_prix_quantite(listing_demande, listing_offre),
        geo_logistique=score_geo_logistique(logistique),
        fiabilite=score_fiabilite(profil),
        delais=score_delais(listing_offre, listing_demande),
    )

    score_global_0_1 = (
        criteria.produit * POIDS_GLOBAL["produit"]
        + criteria.prix_quantite * POIDS_GLOBAL["prix_quantite"]
        + criteria.geo_logistique * POIDS_GLOBAL["geo_logistique"]
        + criteria.fiabilite * POIDS_GLOBAL["fiabilite"]
        + criteria.delais * POIDS_GLOBAL["delais"]
    )

    return MatchResult(
        listing_id=listing_offre.id,
        score_global=round(score_global_0_1 * 100, 1),   # conversion en 0-100
        scores_detailles=criteria,
        explication=generer_explication(criteria),
    )

































