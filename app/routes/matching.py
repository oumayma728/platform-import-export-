from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import verify_token

from app.models.listing import Listing as DBListing
from app.models.company import Company
from app.models.user import User
from app.models.conversations import Conversation

from app_2.models import (
    Listing as MatchingListing,
    ProfilEntreprise,
    DonneesLogistiques,
)

from app_2.scoring import calcul_score_global
from app_2.mock_client import get_donnees_logistiques


router = APIRouter(
    prefix="/matching-results",
    tags=["Matching IA"],
)

TYPE_OPPOSE = {
    "offre": "demande",
    "demande": "offre",
}


def _normalize_user_roles(role_value: str | None) -> set[str]:
    """Normalise les rôles stockés en base (FR/EN, séparés par virgule)."""
    if not role_value:
        return set()

    mapping = {
        "EXPORTATEUR": "exporter",
        "IMPORTATEUR": "importer",
        "EXPORTER": "exporter",
        "IMPORTER": "importer",
    }

    roles = set()
    for raw in str(role_value).split(","):
        value = raw.strip()
        if not value:
            continue
        roles.add(mapping.get(value.upper(), value.lower()))
    return roles


def _matching_direction_for_user(user: User | None) -> tuple[str | None, str | None]:
    """
    Retourne (type_de_mes_annonces, type_des_candidats).

    Règle métier :
    - exportateur -> ses OFFRES sont comparées aux DEMANDES ;
    - importateur -> ses DEMANDES sont comparées aux OFFRES ;
    - double rôle / rôle inconnu -> chaque annonce est comparée à son type opposé.
    """
    roles = _normalize_user_roles((user.type_compte or user.role) if user else None)

    exporter_only = "exporter" in roles and "importer" not in roles
    importer_only = "importer" in roles and "exporter" not in roles

    if exporter_only:
        return "offre", "demande"
    if importer_only:
        return "demande", "offre"
    return None, None


UNIT_FAMILIES = {
    "g": "mass",
    "kg": "mass",
    "tonne": "mass",

    "l": "volume",
    "m3": "volume",

    "piece": "count",
}

UNIT_TO_BASE = {
    "g": 0.001,
    "kg": 1.0,
    "tonne": 1000.0,

    "l": 1.0,
    "m3": 1.0,

    "piece": 1.0,
}
UNIT_FAMILIES = {
    "g": "mass",
    "kg": "mass",
    "tonne": "mass",

    "l": "volume",
    "m3": "volume",

    "piece": "count",
}

UNIT_TO_BASE = {
    "g": 0.001,       # kg
    "kg": 1.0,
    "tonne": 1000.0,  # kg

    "l": 1.0,
    "m3": 1.0,

    "piece": 1.0,
}


def normalize_unit(unit: str | None) -> str | None:
    if not unit:
        return None

    return (
        str(unit)
        .strip()
        .lower()
        .replace("litre", "l")
        .replace("litres", "l")
    )


def units_compatibles(
    unit_a: str | None,
    unit_b: str | None,
) -> bool:
    """
    Vérifie que les deux quantités appartiennent à
    la même famille d'unité.
    """

    a = normalize_unit(unit_a)
    b = normalize_unit(unit_b)

    # anciennes annonces sans unité :
    # on ne bloque pas le matching
    if not a or not b:
        return True

    return UNIT_FAMILIES.get(a) == UNIT_FAMILIES.get(b)


def quantity_normalized(
    quantity: float | None,
    unit: str | None,
) -> float:
    if quantity is None:
        return 0.0

    normalized_unit = normalize_unit(unit)

    factor = UNIT_TO_BASE.get(
        normalized_unit,
        1.0,
    )

    return float(quantity) * factor


def normalize_unit(
    unit: str | None,
) -> str | None:

    if not unit:
        return None

    return (
        str(unit)
        .strip()
        .lower()
        .replace("litre", "l")
        .replace("litres", "l")
    )


def units_compatibles(
    unit_a: str | None,
    unit_b: str | None,
) -> bool:

    a = normalize_unit(unit_a)
    b = normalize_unit(unit_b)

    if not a or not b:
        return True

    return UNIT_FAMILIES.get(a) == UNIT_FAMILIES.get(b)


def quantity_normalized(
    quantity: float | None,
    unit: str | None,
) -> float:

    if quantity is None:
        return 0.0

    unit = normalize_unit(unit)

    return float(quantity) * UNIT_TO_BASE.get(
        unit,
        1.0,
    )


def _to_matching_listing(
    db_listing: DBListing,
) -> MatchingListing:

    pays = (
        db_listing.pays_origine
        if db_listing.type == "offre"
        else db_listing.pays_destination
    ) or db_listing.pays_origine or db_listing.pays_destination or "N/A"

    return MatchingListing(
        id=str(db_listing.id),
        type=db_listing.type,
        produit=db_listing.titre or "",
        categorie=db_listing.categorie or "",
        prix_unitaire=db_listing.prix or 0.0,

        quantite=int(
            quantity_normalized(
                db_listing.quantite,
                db_listing.quantity_unit,
            )
        ),

        pays=pays,

        date_disponibilite=db_listing.date_disponibilite,
        date_limite=db_listing.date_limite,

        entreprise_id=str(
            db_listing.company_id
            or db_listing.user_id
        ),
    )


def _build_profil_entreprise(
    db: Session,
    db_listing: DBListing,
) -> ProfilEntreprise:

    company = None

    if db_listing.company_id:
        company = db.get(
            Company,
            db_listing.company_id,
        )

    certifications = []

    if company and company.certifications:
        certifications = [
            c.strip()
            for c in company.certifications.split(",")
            if c.strip()
        ]

    owner_id = db_listing.user_id

    reputation = 0.0

    if company and company.reputation_score is not None:
        reputation = max(
            0.0,
            min(
                1.0,
                float(company.reputation_score),
            ),
        )

    nb_transactions = _count_transactions(
        db,
        owner_id,
    )

    return ProfilEntreprise(
        entreprise_id=str(
            db_listing.company_id
            or owner_id
        ),
        reputation_score=reputation,
        certification=certifications,
        nb_transactions=nb_transactions,
    )

def _build_donnees_logistiques(
    db_listing_offre: DBListing,
    db_listing_demande: DBListing,
) -> DonneesLogistiques | None:

    pays_origine = (
        db_listing_offre.pays_origine
        or db_listing_offre.pays_destination
        or ""
    ).upper()
    pays_destination = (
        db_listing_demande.pays_destination
        or db_listing_demande.pays_origine
        or ""
    ).upper()

    if not pays_origine or not pays_destination:
        return None

    logistique = get_donnees_logistiques(pays_origine, pays_destination)
    if logistique is not None:
        return logistique

    if (
        db_listing_offre.distance_km is None
        or db_listing_offre.estimated_cost_usd is None
        or db_listing_offre.estimated_days is None
    ):
        return None

    return DonneesLogistiques(
        pays_origine=pays_origine,
        pays_destination=pays_destination,
        distance_km=db_listing_offre.distance_km,
        cout_transport=db_listing_offre.estimated_cost_usd,
        delai_transport_jours=db_listing_offre.estimated_days,
    )


def _reasons_from_criteria(
    criteria,
) -> dict:

    def tier(
        score: float,
        haut: str,
        moyen: str,
        bas: str,
    ) -> str:

        if score >= 0.75:
            return haut

        if score >= 0.5:
            return moyen

        return bas

    return {
        "product": tier(
            criteria.produit,
            "Produit correspondant précisément à votre annonce",
            "Produit globalement compatible",
            "Produit peu compatible",
        ),

        "price": tier(
            criteria.prix_quantite,
            "Prix et quantité bien alignés",
            "Prix ou quantité à négocier",
            "Écart important sur le prix ou la quantité",
        ),

        "location": tier(
            criteria.geo_logistique,
            "Logistique favorable (distance/coût/délai)",
            "Logistique correcte",
            "Logistique coûteuse ou lente",
        ),

        "reliability": tier(
            criteria.fiabilite,
            "Partenaire fiable",
            "Fiabilité correcte",
            "Fiabilité du partenaire à vérifier",
        ),

        "deadline": tier(
            criteria.delais,
            "Délais largement respectés",
            "Délais tout juste respectés",
            "Délais incompatibles",
        ),
    }


@router.get("")
def get_matches(
    min_score: Optional[int] = Query(
        default=None,
        ge=0,
        le=100,
        alias="minScore",
    ),

    listing_id: Optional[int] = Query(
        default=None,
        alias="listingId",
    ),

    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):

    db_user = db.get(User, current_user["id"])
    source_type_for_role, target_type_for_role = _matching_direction_for_user(db_user)

    mes_annonces_query = (
        db.query(DBListing)
        .filter(
            DBListing.user_id == current_user["id"],
            DBListing.suspendue.is_(False),
            DBListing.statut == "active",
        )
    )

    # Le rôle détermine le besoin métier. Un exportateur cherche des demandes ;
    # un importateur cherche des offres. On ignore donc ses annonces du mauvais
    # type au lieu de produire des correspondances incohérentes.
    if source_type_for_role is not None:
        mes_annonces_query = mes_annonces_query.filter(
            DBListing.type == source_type_for_role
        )

    if listing_id is not None:
        mes_annonces_query = mes_annonces_query.filter(
            DBListing.id == listing_id
        )

    mes_annonces = mes_annonces_query.all()

    resultats = []

    for mon_annonce in mes_annonces:

        type_oppose = (
            target_type_for_role
            or TYPE_OPPOSE.get(mon_annonce.type)
        )

        if not type_oppose:
            continue

        candidats = (
            db.query(DBListing)
            .filter(
                DBListing.type == type_oppose,
                DBListing.user_id != current_user["id"],
                DBListing.suspendue.is_(False),
                DBListing.statut == "active",
            )
            .all()
        )

        for candidat in candidats:

            # ---------------------------------------------------------
            # Vérification quantité / unité
            # ---------------------------------------------------------

            if not units_compatibles(
                mon_annonce.quantity_unit,
                candidat.quantity_unit,
            ):
                continue

            # ---------------------------------------------------------
            # Déterminer offre / demande
            # ---------------------------------------------------------
         
            if mon_annonce.type == "offre":
                db_offre = mon_annonce
                db_demande = candidat
            else:
                db_offre = candidat
                db_demande = mon_annonce

            # ---------------------------------------------------------
            # Conversion vers le moteur Sami
            # ---------------------------------------------------------

            listing_offre = _to_matching_listing(
                db_offre
            )

            listing_demande = _to_matching_listing(
                db_demande
            )

            profil = _build_profil_entreprise(
                db,
                db_offre,
            )

            logistique = _build_donnees_logistiques(
                db_offre,
                db_demande,
            )

            resultat = calcul_score_global(
                listing_demande,
                listing_offre,
                profil=profil,
                logistique=logistique,
            )

            # ---------------------------------------------------------
            # Filtre score
            # ---------------------------------------------------------

            if (
                min_score is not None
                and resultat.score_global < min_score
            ):
                continue

            # ---------------------------------------------------------
            # Informations partenaire
            # ---------------------------------------------------------

            company = (
                db.query(Company)
                .filter(
                    Company.user_id
                    == candidat.user_id
                )
                .first()
            )

            owner = db.get(
                User,
                candidat.user_id,
            )

            counterpart_name = (
                company.nom
                if company
                else None
            ) or (
                owner.entreprise
                if owner
                else None
            ) or (
                owner.nom
                if owner
                else "Partenaire"
            )

            counterpart_country = (
                candidat.pays_origine
                or candidat.pays_destination
                or ""
            )

            # ---------------------------------------------------------
            # Réponse compatible Front
            # ---------------------------------------------------------

            resultats.append({
                "id": (
                    f"{mon_annonce.id}-"
                    f"{candidat.id}"
                ),

                "listingId": mon_annonce.id,

                "listing": {
                    "id": mon_annonce.id,
                    "type": mon_annonce.type,
                    "product": mon_annonce.titre,
                    "quantity": mon_annonce.quantite,
                    "quantityUnit": mon_annonce.quantity_unit,
                    "category": mon_annonce.categorie,
                    "price": mon_annonce.prix,
                    "currency": mon_annonce.devise,
                    "country": mon_annonce.pays_origine,
                    "destination": mon_annonce.pays_destination,
                    "deadline": (
                        mon_annonce.date_disponibilite
                        if mon_annonce.type == "offre"
                        else mon_annonce.date_limite
                    ),
                    "ownerId": mon_annonce.user_id,
                },

                "matchScore": resultat.score_global,

                "reasons": _reasons_from_criteria(
                    resultat.scores_detailles
                ),

                "counterpart": {
                    "name": counterpart_name,
                    "country": counterpart_country,
                    "ownerId": candidat.user_id,
                },

                "counterpartListingId": candidat.id,

                "counterpartListing": {
                    "id": candidat.id,
                    "type": candidat.type,
                    "product": candidat.titre,
                    "quantity": candidat.quantite,
                    "quantityUnit": candidat.quantity_unit,
                    "category": candidat.categorie,
                    "price": candidat.prix,
                    "currency": candidat.devise,
                    "country": candidat.pays_origine,
                    "destination": candidat.pays_destination,
                    "deadline": (
                        candidat.date_disponibilite
                        if candidat.type == "offre"
                        else candidat.date_limite
                    ),
                    "ownerId": candidat.user_id,
                },
            })

    resultats.sort(
        key=lambda item: item["matchScore"],
        reverse=True,
    )

    return resultats

def _count_transactions(
    db: Session,
    user_id: int,
) -> int:

    return (
        db.query(Conversation)
        .filter(
            Conversation.statut == "CONCLUE",
            (
                (Conversation.initiateur_id == user_id)
                |
                (Conversation.destinataire_id == user_id)
            ),
        )
        .count()
    )