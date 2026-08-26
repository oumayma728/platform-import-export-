# Algorithme de Matching-Documentation

## Vue d'ensemble

L'algorithme compare une annonce (offre ou demande) à toutes les annonces du type opposé, et calcule un score de pertinence entre 0 et 100 pour chaque paire, basé sur 5 critères pondérés. Le classement final applique en plus un système de priorité qui garantit qu'une correspondance exacte de produit passe toujours avant une simple variante.

## Les 5 critères et leurs poids

| Critère | Poids | Fonction |
|---|---|---|
| Produit / catégorie | 25% | `score_produit_categorie()` |
| Prix / quantité | 25% | `calcul_score_prix_quantite()` |
| Géo / logistique | 25% | `score_geo_logistique()` |
| Fiabilité | 15% | `score_fiabilite_reputation()` |
| Délais de disponibilité | 10% | `compatibilite_offre_demande()` |

## Formule du score global

```
score_pondere = (
    score_produit × 0.25
    + score_prix_quantite × 0.25
    + score_geo × 0.25
    + score_fiabilite × 0.15
    + score_delais × 0.10
)

# Verrou : si le produit ne correspond quasiment pas, pénalité forte
# du score global entier, peu importe les autres critères
si score_produit < 0.15 :
    score_pondere = score_pondere × 0.2

score_global = min(score_pondere × 100, 100)
```

Chaque score individuel est calculé sur une échelle de 0 à 1, puis le résultat final est ramené sur une échelle de 0 à 100 (choix imposé par le ticket #2169).

## Détail de chaque critère

### 1. Produit / catégorie (25%)

Trois fonctions combinées :

**`matching_exact()`** — court-circuit sur correspondance parfaite
Compare les deux noms de produit après nettoyage (minuscules, tous les espaces supprimés — pas seulement en début/fin, pour tolérer aussi des variantes comme "T shirt" / "T-shirt"). Si identiques → score `1.0` immédiat, sans calcul supplémentaire.

**`score_categorie()`** — validation de catégorie avec tolérance
- Catégories strictement identiques → `1.0`
- Sinon, similarité textuelle (`SequenceMatcher`) : si ≥ 0.85 (tolère une faute de frappe légère) → `1.0`
- En dessous de ce seuil → `0.0` (catégories réellement différentes)

**`code_modele()`** — détection des références de modèle
Un mot contenant un chiffre (ex: "M2", "S23") est presque toujours une référence de modèle, jamais un mot sujet aux fautes de frappe classiques. Si un tel mot diffère entre offre et demande (à structure de phrase identique), c'est considéré comme un signal de produit différent, même si le reste du texte est proche (ex: "MacBook Air M2" vs "MacBook Air M3").

**Formule combinée** :
```
si matching_exact : retourner 1.0

score_prod = similarité_texte(produit_offre, produit_demande)
si code_modele détecté :
    score_prod = score_prod × 0.3   # forte pénalité

score = 0.7 × score_categorie + 0.3 × score_prod
```

### 2. Prix / quantité (25%)

- Prix : accepté si dans une fourchette de ±15% autour du budget (borne haute ET basse, conformément à la formulation du ticket)
- Quantité : acceptée si au moins 90% de la quantité demandée est disponible (une seule borne — un surplus n'est jamais pénalisé)
- Score combiné : 60% prix, 40% quantité

### 3. Géo / logistique (25%)

- Distance calculée entre pays via une table de coordonnées GPS (~90 pays) et la formule de Haversine
- Coût et délai de transport estimés par formule à partir de la distance (`coût = 100 + distance × 0.05`, `délai = 3 + distance / 500`) — hypothèses V1 documentées, en attendant l'API logistique réelle du Backend
- Score combiné : 30% distance, 35% coût, 35% délai

### 4. Fiabilité (15%)

- Réputation de l'entreprise (notée sur 5, normalisée en la divisant par 5)
- Certifications reconnues, pondérées selon une source externe citée (ISO9001 25%, Fairtrade 20%, ISO14001 20%, BCorp 15%, Ecocert 10%, GlobalCompact 10%)
- Historique de transactions (normalisé, plafonné à 100 transactions = score max)
- Score combiné : 50% réputation, 30% certifications, 20% historique

### 5. Délais de disponibilité (10%)

- Compare la date de disponibilité de l'offre à la date limite de la demande
- Tolérance de 7 jours à score plein (1.0)
- Score dégressif au-delà : 0.8 (7-14 jours de retard), 0.5 (14-30 jours), 0.0 (au-delà de 30 jours)

## Mécanisme de priorité produit (classement final)

En plus du score numérique, un système de priorité en 2 niveaux est appliqué lors du classement de plusieurs correspondances (fonction `trouver_correspondances()`, dans `services/matching.py`) :

| Priorité | Condition |
|---|---|
| 2 | Produit exactement identique (`matching_exact`) |
| 1 | Même catégorie, produit différent |
| 0 | Catégorie différente |

**Tri appliqué** : d'abord par priorité (décroissant), puis par score global en cas d'égalité de priorité.

**Pourquoi ce mécanisme existe** : un score pondéré seul pouvait, dans certains cas, classer une correspondance exacte de produit après une simple variante mieux notée sur d'autres critères (ex: la géographie). Le tri en 2 niveaux garantit qu'une correspondance produit exacte est toujours proposée en priorité, indépendamment des autres critères.

## Architecture des fichiers

```
services/
├── scoring.py     # Calcul du score entre DEUX annonces précises
│   ├── score_produit_categorie()
│   ├── calcul_score_prix_quantite()
│   ├── score_geo_logistique()
│   ├── score_fiabilite_reputation()
│   ├── compatibilite_offre_demande()
│   └── scoring_global()          # Combine les 5 critères
│
└── matching.py    # Recherche et classement parmi TOUTES les annonces
    ├── determiner_priorite()
    ├── trouver_listing_par_id()
    └── trouver_correspondances() # Utilise scoring_global() + priorité
```

## Gestion des dépendances externes non encore prêtes

Certaines données (coût/délai logistique, réputation/fiabilité) proviendraient normalement d'APIs développées par d'autres membres de l'équipe (Backend, module Trust). En attendant leur disponibilité, ces fonctions utilisent des données mockées ou des formules d'estimation, documentées par des commentaires `# TODO` indiquant le remplacement prévu une fois les APIs réelles disponibles.

## Limites connues, documentées honnêtement

- Le score de similarité textuelle pure a une limite intrinsèque sur certains cas de produits différents mais structurellement proches (ex: "chargeurs" vs "câbles", même catégorie) ; le tri par priorité atténue cet effet en pratique sans l'éliminer totalement dans le score brut
- La détection de modèle (`code_modele`) ne couvre que les différences impliquant un chiffre ; une différence purement en lettres (ex: "Pro" vs "Max") n'est pas détectée par cette règle
- Les poids et seuils (tolérances, seuil du verrou à 0.15, seuil de similarité catégorie à 0.85) sont des valeurs ajustées empiriquement sur les données de test disponibles, documentées comme hypothèses de V1 — voir `tests/test_results.md` pour le détail des scénarios validés et `CHOIX_TECHNIQUES.md` pour la justification complète de chaque décision

## Références

- `/docs` (Swagger, générée automatiquement) — spécification complète de l'API