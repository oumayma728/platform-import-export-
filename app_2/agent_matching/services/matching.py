from typing import Optional
from config.settings import settings
import requests
from models.schemas import Listing , TypeListing
from services.scoring import scoring_global , matching_exact
from tests.fixtures.listings_mockes import LISTINGS_MOCKES

def get_tous_les_listings() -> list[Listing]:
    try:
        response = requests.get(settings.listings_api_url, timeout=5)
        response.raise_for_status()
        return [Listing(**item) for item in response.json()]
    except requests.RequestException:
        return LISTINGS_MOCKES
 # TODO : elle necessite un changement par la suite 
 
def determiner_priorite ( listing_offre : Listing , listing_demande : Listing ) :
    if matching_exact( listing_offre.produit , listing_demande.produit ) :
        return 2 
    cat_offre = listing_offre.categorie.strip().lower()
    cat_demande = listing_demande.categorie.strip().lower()
    if cat_offre == cat_demande : 
        return 1
    return 0 

def trouver_listing_par_id( listing_id: str, tous_les_listings: list[Listing]) -> Optional[Listing]:
    for element in tous_les_listings:
        if element.id == listing_id:
            return element
    return None

def trouver_correspondances( listing_source: Listing, tous_les_listings: list[Listing]) :

   if listing_source.type == TypeListing.offre:
    type_oppose = TypeListing.demande
   else:
    type_oppose = TypeListing.offre

   annonces = [element for element in tous_les_listings if element.type == type_oppose]

   resultats = []
   for annonce in annonces:
        if listing_source.type == TypeListing.offre:
            offre, demande = listing_source, annonce
        else:
            offre, demande = annonce, listing_source

        s = scoring_global(demande, offre)
        priorite = determiner_priorite(offre, demande)
        resultats.append((priorite, s , annonce ))

   resultats.sort(key=lambda x: (x[0], x[1].score_global), reverse=True)

   return resultats
    