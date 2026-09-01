# le scoring prix
def prix_avec_tolerance( prix_unitaire_offre : float , budget_max_demandeur : float ) :
    tolerance: float = 0.15
    seuil_min = budget_max_demandeur * (1 - tolerance)
    seuil_max = budget_max_demandeur * (1 + tolerance)
    return seuil_min <= prix_unitaire_offre <= seuil_max
 
#Créer une fonction vérifiant si quantité_offerte >= quantité_demandée avec tolérance de -10%
def quantite_avec_tolerance(quantite_offerte : float ,
                             quantite_demandee: float ):
    tolerance : float = 0.1 
    seuil_min = quantite_demandee * ( 1 - tolerance)
    return  quantite_offerte >= seuil_min
#Calculer un score combiné : moyenne pondérée (60% prix, 40% quantité) normalisé entre 0 et 1

def calcul_score_prix_quantite(prix_unitaire_offre : float , budget_max_demandeur : float
                            , quantite_offerte : float , quantite_demandee: float ) :
    prix  = float( prix_avec_tolerance(prix_unitaire_offre , budget_max_demandeur ))
    quantite = float( quantite_avec_tolerance(quantite_offerte , quantite_demandee ))
    score = 0.6 * prix + 0.4 * quantite
    return score


#le scoring délais de disponibilité
from datetime import date 
def compatibilite_offre_demande( offre_date : date, demande_date : date):
    if  offre_date <= demande_date :
        return 1.0
    else :
        depassement = (offre_date - demande_date).days
        if depassement <= 7:
            return 1.0
        elif depassement <= 14:
            return 0.8
        elif depassement <= 30:
            return 0.5
        else:
            return 0.0

# le scoring fiabilité et réputation
donnes_trust_mockees = {
    "ent-tr-01": {"reputation_score": 4.2, "certifications": ["ISO9001"], "historique_transactions": 42},
    "ent-ma-01": {"reputation_score": 4.7, "certifications": ["ISO9001", "Fairtrade"], "historique_transactions": 60},
    "ent-bd-01": {"reputation_score": 3.0, "certifications": [], "historique_transactions": 15},
}

def recuperation_donnees_trust ( id_entreprise : str ) :
     # TODO : remplacer par un vrai appel à settings.trust_api_url une fois l'API prête
    if id_entreprise in donnes_trust_mockees :
        return donnes_trust_mockees[id_entreprise]
    return {"reputation_score": 2.5, "certifications": [], "historique_transactions": 0}

# Poids des certifications, sélectionnées et pondérées d'après :
# "Les certifications à connaître pour crédibiliser votre entreprise" - 425ppm.com
certification_pertinentes={
    "ISO9001": 0.25,
    "Fairtrade": 0.20,
    "ISO14001": 0.20,
    "BCorp": 0.15,
    "Ecocert": 0.10,
    "GlobalCompact": 0.10,
}

def score_certifications( certifications : list):
    if not certifications :
        return 0.0
    score = sum( certification_pertinentes.get(cert , 0) for cert in certifications )
    return round(min (score, 1.0) , 4)


def score_fiabilite_reputation ( id_entreprise : str ) :
    donnees = recuperation_donnees_trust ( id_entreprise )
    score_cert = score_certifications( donnees["certifications"])
    score_reputation = min(donnees["reputation_score"] / 5, 1.0)
    score_historique = min(donnees["historique_transactions"] /100 , 1.0)
    score = 0.5 * score_reputation + 0.3 * score_cert + 0.2 * score_historique
    return round(min(score,1.0) , 4)

# le scoring géographique et logistique



import requests
from config.settings import settings
from services.geo_service import calculer_distance_pays
def recuperation_cout_transport(pays_source : str , pays_destination : str ):
    # TODO : remplacer par un vrai appel à settings.logistics_api_url une fois l'API prête
    distance = calculer_distance_pays(pays_source, pays_destination)
    cout = 100 + (distance * 0.05)
    delai = 3 + (distance / 500)
    return {"cout": round(cout, 2), "delai_jours": round(delai)}

def score_geo_logistique(pays_source : str , pays_destination : str ):
     distance = calculer_distance_pays(pays_source , pays_destination)
     donnees = recuperation_cout_transport(pays_source , pays_destination)
     score_distance = max( 0, 1 - (distance/15000))
     score_cout = max( 0, 1 - (donnees ["cout"]/1500))
     score_delai = max( 0, 1 - ( donnees ["delai_jours"]/60)  )
     score = 0.3 * score_distance + 0.35 * score_cout + 0.35 * score_delai
     return round(min( score , 1 ) , 4)


 #le scoring produit/catégorie

def matching_exact(produit_offre: str, produit_demande: str):
   offre = produit_offre.lower().replace(" ", "")
   demande = produit_demande.lower().replace(" ", "")
   return offre == demande

from difflib import SequenceMatcher
def score_categorie(categorie_offre: str, categorie_demande: str) -> float:
    cat_offre = categorie_offre.strip().lower()
    cat_demande = categorie_demande.strip().lower()
    if cat_offre == cat_demande:      # "vérifier que la catégorie CORRESPOND"
        return 1.0
    similarite = SequenceMatcher(None, cat_offre, cat_demande).ratio()
    
    if similarite >= 0.85:
        return 1.0
    return 0.0
"""Détecte si un mot contenant un chiffre (probable référence produit,
    ex: M2/M3, S23/A23) diffère entre les deux textes, malgré une structure
    similaire par ailleurs."""
def code_modele( produit_offre: str, produit_demande: str ):
    offre= produit_offre.strip().lower().split()
    demande= produit_demande.strip().lower().split()
    if len(offre) != len(demande) :
        return False
    for m1 , m2 in zip ( demande , offre ) :
        contient_chiffre = any(c.isdigit() for c in m1) or any(c.isdigit() for c in m2)
        if contient_chiffre and m1 != m2:
            return True
    return False

def score_produit_categorie(produit_offre: str, produit_demande: str,categorie_offre : str ,
                             categorie_demande: str ):
    if matching_exact(produit_offre,produit_demande):
        return 1.0
    score_cat = score_categorie( categorie_offre , categorie_demande)
    
    score_prod = SequenceMatcher( None ,produit_offre.strip().lower() ,
                                  produit_demande.strip().lower(),
                                  ).ratio()

    if code_modele( produit_offre, produit_demande):
        score_prod = score_prod * 0.3 
    score = 0.7 * score_cat + 0.3 * score_prod
    return round(score, 4)

#scoring global
POIDS = {
    "produit": 0.25,
    "prix_quantite": 0.25,
    "geo": 0.25,
    "fiabilite": 0.15,
    "delais_disp": 0.10,
}
from models.schemas import Listing
from models.schemas import MatchResult
from models.schemas import MatchingCriteria

def scoring_global( listing_demande : Listing , listing_offre : Listing ):
    scoring_prix = calcul_score_prix_quantite(listing_offre.prix , listing_demande.prix ,
                                               listing_offre.quantite , listing_demande.quantite)
    
    scoring_delai = compatibilite_offre_demande(listing_offre.date_disponibilite , listing_demande.date_limite)
    scoring_fiabilite = score_fiabilite_reputation (listing_offre.entreprise_id)
    scoring_geo = score_geo_logistique( listing_offre.pays , listing_demande.pays )
    scoring_produit = score_produit_categorie(listing_offre.produit, listing_demande.produit ,
                                              listing_offre.categorie , listing_demande.categorie)

    score_global = (
        scoring_produit * POIDS["produit"]
        + scoring_prix * POIDS["prix_quantite"]
        + scoring_geo * POIDS["geo"]
        + scoring_fiabilite * POIDS["fiabilite"]
        + scoring_delai * POIDS["delais_disp"]
    ) * 100

    if scoring_produit < 0.15 :
        score_global = score_global * 0.2
    
    score_global = round( min ( score_global , 100 ) , 4 )
    criteres = MatchingCriteria(
        produit=scoring_produit * 100,
        prix_quantite=scoring_prix * 100,
        geo=scoring_geo * 100,
        fiabilite=scoring_fiabilite * 100,
        delais_disp=scoring_delai * 100,
    )

    resultat = MatchResult(
        listing_id=listing_offre.id,
        score_global=score_global,
        scores_detailles_par_critere=criteres,
        explication="Ce score est obtenu à partir de 5 critères pondérés (produit, prix/quantité, géo-logistique, fiabilité, délais). Il facilite le classement mais ne garantit pas une correspondance parfaite.",
    )
    return resultat