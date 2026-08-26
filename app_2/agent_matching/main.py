from fastapi import FastAPI
from services.geo_service import get_coordonnees
app = FastAPI()


@app.get("/api/coordonnees/{pays}")
def obtenir_coordonnees(pays: str):
    coordonnees = get_coordonnees(pays)
    if coordonnees is None:
        return {"erreur": f"Pays '{pays}' non trouvé"}
    return {"pays": pays, "latitude": coordonnees[0], "longitude": coordonnees[1]}

# API REST exposant la fonction de matching

from models.schemas import MatchingRequest
from services.matching import trouver_correspondances, trouver_listing_par_id , get_tous_les_listings
from typing import List
from models.schemas import MatchResult

@app.post("/api/matching/find-matches" , response_model=List[MatchResult])
def trouver_une_annonce ( requete : MatchingRequest ):
    tous_les_listings = get_tous_les_listings()
    listing_source = trouver_listing_par_id( requete.listing_id , tous_les_listings )
    if listing_source is None :

        return {"erreur" : f" Listing '{requete.listing_id}' non trouvé "}
    resultas= trouver_correspondances( listing_source , tous_les_listings )
    if requete.score_min is not None :
        resultas= [ r for r in resultas if r[1].score_global >= requete.score_min ]
    if requete.pays is not None:
        resultas = [r for r in resultas if r[2].pays.strip().lower() == requete.pays.strip().lower()]
    if requete.prix_max is not None:
        resultas = [r for r in resultas if r[2].prix <= requete.prix_max]

    resultas_page = resultas[requete.offset: requete.offset + requete.limit]
    return [r[1] for r in resultas_page]
