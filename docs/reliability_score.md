# Score de fiabilité partagé — Document d'API (Stagiaire 4 → Stagiaire 3)

Ce document décrit le **score de fiabilité / réputation** produit par le module
Trust & Safety (Stagiaire 4) et consommé par l'**Agent IA de Matching**
(Stagiaire 3). Il définit la structure de l'artefact, les règles de calcul et
les endpoints d'accès. Le contrat est **stable** : les noms de champs et les
poids ne doivent pas être modifiés sans mise à jour conjointe du consommateur.

## 1. Vue d'ensemble

- Le score est calculé par `backend/trust.py` (`compute_trust_score`) et stocké
  sur l'entreprise (`Entreprise.trustScore` + `Entreprise.trustScoreDetails`).
- Plage : **0.0 – 100.0**.
- Calcul : somme pondérée de 6 composantes, plafonnée et bornée à [0, 100].
- Le score est recalculé automatiquement lors de chaque événement de confiance
  (validation, rejet, suspension, avis, badge, vérification KYB, traitement de
  signalement) et sur demande via `POST /api/admin/trust/recompute-all`.

## 2. Artefact JSON (`Entreprise.trustScoreDetails`)

```json
{
  "score": 82.5,
  "computed_at": "2026-08-07T10:00:00Z",
  "components": {
    "kyb_verified": 30,
    "avg_review_score": 28.5,
    "review_count": 12,
    "response_rate": 15,
    "account_age_months": 9,
    "flags_penalty": 0
  },
  "badges": ["VERIFIED", "TOP_EXPORTER"]
}
```

| Champ | Type | Description |
| --- | --- | --- |
| `score` | float (0–100) | Score global de fiabilité. |
| `computed_at` | string (ISO 8601) | Horodatage du dernier calcul. |
| `components` | objet | Détail des sous-scores (voir §3). |
| `badges` | string[] | Codes des badges actifs de l'entreprise (UPPER_SNAKE). |

## 3. Règles de calcul

Le score = somme des composantes suivantes, **hors `review_count`** qui est
informatif uniquement :

| Composante | Poids max | Règle |
| --- | --- | --- |
| `kyb_verified` | 30 | 30 si la dernière `KYBVerification` a `statut = "verified"`, sinon 0. |
| `avg_review_score` | 30 | `round((note_moyenne / 5) * 30, 2)` sur les avis reçus (note 1–5). |
| `response_rate` | 15 | `round((conversations_répondues / conversations_total) * 15, 2)`. Une conversation est « répondue » si l'entreprise et l'interlocuteur ont chacun envoyé au moins un message. |
| `account_age_months` | 15 | `min(nb_mois_depuis_création, 15)` — 1 point par mois, plafonné à 15. |
| `flags_penalty` | −20 | `-min(nb_signalements_ouverts * 5, 20)`. Signalements ouverts = statut `pending`/`processed`/`en_attente`/`en_cours`/`traite` visant l'entreprise ou ses utilisateurs. |
| `review_count` | — | Nombre d'avis reçus (informatif, n'entre pas dans la somme). |

**Bornage** : `score = max(0.0, min(100.0, somme))`.

## 4. Badges

Deux mécanismes :

1. **Manuel** (par l'admin, spec §5.4) : définitions `Badge` (code, nom,
   description, `criteres` JSON) créées/attribuées/révoquées via les endpoints
   admin. Exemples : `VERIFIED`, `CERTIFIED`, `TOP_EXPORTER`, `TOP_IMPORTER`.
2. **Automatique** : `_evaluate_badge_criteres` évalue les règles JSON de chaque
   définition : `min_trust_score`, `min_reviews`, `min_avg_review_score`,
   `kyb_verified` (bool), `max_flags_penalty`. Un badge remplissant ses critères
   est attribué automatiquement ; un badge déjà attribué n'est jamais retiré.

Des badges legacy `TrustBadge` (`entreprise_verifiee`, `entreprise_certifiee`,
`top_exporter`, `top_importer`) sont générés à la volée par les workflows et
normalisés en codes majuscules dans `badges` de l'artefact.

## 5. Endpoints

### 5.1 Public / consommation matcher (Stagiaire 3)

| Méthode | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/internal/entreprises/{entreprise_id}/trust-score` | clé interne (`INTERNAL_API_KEY`, en-tête `X-Internal-Key`) | Score + détails (idem §2). |
| GET | `/api/accounts/{user_id}` | public | Score agrégé de l'entreprise d'un utilisateur (`trustScore`), note moyenne, nombre d'avis, liste des avis. |

### 5.2 Admin (Stagiaire 4)

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/api/admin/enterprises` | Liste des entreprises avec `trustScore`. |
| GET | `/api/admin/enterprises/{id}` | Détail avec `trustScoreDetails` (décomposé). |
| GET | `/api/admin/reliability-score/{entreprise_id}` | Recalcule et retourne le score d'une entreprise. |
| POST | `/api/admin/trust/recompute-all` | Recalcule tous les scores (job de sécurité). |

## 6. Consommation par l'Agent IA de Matching (Stagiaire 3)

Le matcher doit utiliser le champ `score` (et éventuellement `badges`) pour
pondérer/valoriser les contreparties potentielles lors du calcul de compatibilité.
Recommandations :

- Traiter `score` comme une métrique continue normalisée sur 100.
- Utiliser `badges` comme signaux discrets (ex : booster une contrepartie
  `VERIFIED`/`TOP_EXPORTER`).
- Ne pas utiliser `components` pour du scoring à la volée : la valeur `score`
  **déjà calculée et stockée** est la source de vérité (cohérence et stabilité).
- Si `trustScore` est `null`, considérer l'entreprise comme non évaluée
  (score 0 ou neutre selon la politique du matcher).

## 7. Stabilité et versioning

- Contrat de l'artefact : **v1**, décrit en §2.
- Toute évolution (ajout de composante, changement de poids) doit :
  1. mettre à jour `trust.py` et le docstring de contrat ;
  2. mettre à jour ce document ;
  3. recalculer les scores (`POST /api/admin/trust/recompute-all`) ;
  4. prévenir le consommateur (Stagiaire 3) avant mise en production.
