
# Schemas de donnees pour l'Agent IA 

from datetime import date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class TypeListing ( str, Enum) :
    offre = "offre"
    demande = "demande"

class Listing (BaseModel) : # verification automatique de chaque champ avec BaseModel
    id : str
    entreprise_id: str
    type : TypeListing
    produit : str
    categorie : str 
    prix : float = Field (gt=0)
    quantite : int = Field (gt=0)
    pays : str 
    # Pourquoi deux champs de type "date" plutôt qu'un seul champ "delai" (int) :
    #
    # 1. Le CDC distingue deux notions différentes qui portent des noms proches :
    #    - le "délai de transport" = une DURÉE (ex: 15 jours) → ne vient pas de Listing,
    #      mais de l'API logistique (voir score_geo_logistique), donc pas besoin d'un champ ici
    #    - les "délais de disponibilité" = une comparaison de DATES précises entre
    #      la disponibilité de l'exportateur et la deadline de l'importateur
    #
    # 2. Une offre et une demande n'ont pas le même besoin :
    #    - une OFFRE remplit date_disponibilite ("je peux livrer à partir de...")
    #    - une DEMANDE remplit date_limite ("j'ai besoin avant le...")
    #    Un seul champ générique obligerait à vérifier le type du listing à chaque
    #    lecture pour savoir comment interpréter la valeur - source de confusion/bugs.
    #
    # 3. La fonction compatibilite_offre_demande() compare directement ces deux
    #    dates (offre_date <= demande_date) - un simple entier ne le permettrait pas.

    date_disponibilite: Optional[date] = Field(default=None)
    date_limite: Optional[date] = Field(default=None)


class MatchingCriteria (BaseModel) :
    produit : float = Field( ge=0 , le=100) 
    prix_quantite : float = Field( ge=0 , le=100)
    geo : float  = Field( ge=0 , le=100)
    fiabilite : float = Field( ge=0 , le=100)
    delais_disp : float = Field ( ge=0 , le = 100 )


class MatchResult (BaseModel) :
    listing_id : str
    score_global : float  = Field( ge=0 , le=100)
    scores_detailles_par_critere : MatchingCriteria
    explication : Optional[str] = Field(default=None)

    
class MatchingRequest( BaseModel ) :
    listing_id : str = Field(..., description="Identifiant du listing pour lequel chercher des correspondances")
    limit: int = Field(default=10, description="Nombre maximum de résultats à retourner")
    offset : int = 0 
    score_min : Optional[float] = None
    pays : Optional[str] = None
    prix_max : Optional[float] = None


