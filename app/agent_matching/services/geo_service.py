import math
from data.coordonnees_pays import COORDONNEES_PAYS


def get_coordonnees(pays: str):
    return COORDONNEES_PAYS.get(pays)


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float):
    rayon_terre = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return rayon_terre * c


def calculer_distance_pays(pays_source: str, pays_destination: str):
    coord_source = get_coordonnees(pays_source)
    coord_dest = get_coordonnees(pays_destination)
    if coord_source is None or coord_dest is None:
        return 5000
    return distance_km(coord_source[0], coord_source[1], coord_dest[0], coord_dest[1])