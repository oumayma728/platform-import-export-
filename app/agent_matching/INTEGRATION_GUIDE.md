# Guide d'intégration -- Agent IA de Matching

Ce document explique comment consommer l'API de matching depuis le Frontend : accès, format de requête/réponse, et gestion des erreurs.

## Démarrer l'API en local

Comme chaque personne travaille sur sa propre machine, l'API doit être lancée localement pour être accessible :

```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

L'API est alors accessible sur `http://localhost:8000`, **uniquement depuis la machine qui la fait tourner**. La documentation interactive complète (Swagger) est disponible sur `http://localhost:8000/docs`.

## Endpoint principal

```
POST /api/matching/find-matches
Content-Type: application/json
```

### Requête

| Champ | Type | Obligatoire | Défaut | Description |
|---|---|---|---|---|
| `listing_id` | string | Oui | — | Identifiant de l'annonce (offre ou demande) pour laquelle chercher des correspondances |
| `limit` | integer | Non | `10` | Nombre maximum de résultats retournés |
| `offset` | integer | Non | `0` | Index de départ, pour la pagination |
| `score_min` | float | Non | `null` | Score minimum (0-100) — exclut les résultats en dessous |
| `pays` | string | Non | `null` | Filtre les résultats par pays |
| `prix_max` | float | Non | `null` | Exclut les résultats dont le prix dépasse cette valeur |

### Exemple de requête minimale

```json
{
  "listing_id": "demande-001"
}
```

### Exemple de requête avec filtres et pagination

```json
{
  "listing_id": "demande-001",
  "limit": 5,
  "offset": 0,
  "score_min": 30,
  "pays": "Maroc",
  "prix_max": 20
}
```

## Format de la réponse

En cas de succès, l'API retourne une **liste** d'objets, triée par pertinence décroissante (déjà classée, aucun tri à refaire côté Frontend).

### Structure d'un résultat

```json
{
  "listing_id": "offre-001",
  "score_global": 92.835,
  "scores_detailles_par_critere": {
    "produit": 100,
    "prix_quantite": 100,
    "geo": 87.84,
    "fiabilite": 72.5,
    "delais_disp": 100
  },
  "explication": "Ce score est obtenu à partir de 5 critères pondérés (produit, prix/quantité, géo-logistique, fiabilité, délais). Il facilite le classement mais ne garantit pas une correspondance parfaite."
}
```

| Champ | Type | Description |
|---|---|---|
| `listing_id` | string | Identifiant de l'annonce correspondante trouvée |
| `score_global` | float | Score de pertinence global, entre 0 et 100 |
| `scores_detailles_par_critere` | object | Détail du score par critère (voir ci-dessous) |
| `explication` | string | Phrase explicative générique sur le mode de calcul |

### Détail de `scores_detailles_par_critere`

Chaque champ est un score individuel entre 0 et 100 :

| Champ | Critère |
|---|---|
| `produit` | Correspondance du produit et de la catégorie |
| `prix_quantite` | Adéquation prix et quantité |
| `geo` | Proximité géographique et logistique |
| `fiabilite` | Réputation et fiabilité de l'entreprise |
| `delais_disp` | Compatibilité des délais de disponibilité |

### Exemple de réponse complète

```json
[
  {
    "listing_id": "offre-001",
    "score_global": 92.835,
    "scores_detailles_par_critere": {
      "produit": 100,
      "prix_quantite": 100,
      "geo": 87.84,
      "fiabilite": 72.5,
      "delais_disp": 100
    },
    "explication": "Ce score est obtenu à partir de 5 critères pondérés..."
  },
  {
    "listing_id": "offre-002",
    "score_global": 70.6375,
    "scores_detailles_par_critere": {
      "produit": 83.04,
      "prix_quantite": 40,
      "geo": 84.77,
      "fiabilite": 57.9,
      "delais_disp": 100
    },
    "explication": "Ce score est obtenu à partir de 5 critères pondérés..."
  }
]
```

## Gestion des erreurs

### Listing introuvable

Si le `listing_id` envoyé ne correspond à aucune annonce existante, l'API répond avec un objet contenant un champ `erreur` (pas d'exception HTTP, statut `200`) :

```json
{
  "erreur": "Listing 'xyz-inconnu' non trouvé"
}
```

**Recommandation Frontend** : vérifier la présence du champ `erreur` dans la réponse avant de traiter le résultat comme une liste de correspondances.

### Erreur de validation (422)

Si la requête envoyée ne respecte pas le format attendu (ex: `listing_id` manquant, `limit` envoyé comme texte au lieu d'un nombre), l'API répond avec un statut HTTP `422` et un détail structuré :

```json
{
  "detail": [
    {
      "loc": ["body", "listing_id"],
      "msg": "Field required",
      "type": "missing"
    }
  ]
}
```

**Recommandation Frontend** : toujours envoyer au minimum `listing_id` sous forme de texte ; les autres champs peuvent être omis (valeurs par défaut appliquées automatiquement).

### Liste de résultats vide

Si aucune correspondance ne passe les filtres appliqués (`score_min`, `pays`, `prix_max`), l'API retourne une liste vide `[]`, pas une erreur. Ce n'est pas un cas d'échec — le Frontend doit prévoir un affichage adapté ("aucun résultat trouvé") plutôt que de traiter ce cas comme une erreur.

## Comportement du tri et de la pagination

- Les résultats sont **déjà triés** par pertinence avant d'être renvoyés — aucun tri supplémentaire n'est nécessaire côté Frontend
- Une correspondance de produit exactement identique est toujours placée avant une simple variante, même si son score numérique est légèrement inférieur sur d'autres critères
- La pagination (`limit`/`offset`) s'applique **après** les filtres — donc `offset: 10` avec un filtre actif porte sur la liste déjà filtrée, pas sur la liste complète

## Tester rapidement sans Frontend

La documentation interactive (`http://localhost:8000/docs`) permet de tester directement l'API dans le navigateur, avec un bouton "Try it out" — utile pour vérifier un comportement avant de l'intégrer côté React.

## Documents complémentaires

- `MATCHING_ALGORITHM.md` — détail du calcul des scores, poids de chaque critère
- `CHOIX_TECHNIQUES.md` — justification des choix de conception
- `tests/test_results.md` — exemples de scénarios réels testés et validés