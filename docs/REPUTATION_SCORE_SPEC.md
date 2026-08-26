# Score de réputation — Document d'API (Spec #3775)

Ce document définit la **structure JSON du score de réputation** d'une
entreprise, exposée à l'administration via un endpoint dédié. Le contrat est
**stable** : les noms de champs ne doivent pas être modifiés sans mise à jour
conjointe des consommateurs.

## 1. Vue d'ensemble

- Le score de réputation est dérivé du score de fiabilité partagé calculé par
  `backend/trust.py` (`compute_trust_score`) et stocké sur l'entreprise
  (`Entreprise.trustScore` + `Entreprise.trustScoreDetails`).
- L'endpoint recalcule le score à la demande puis le retourne au format stable
  de réputation.
- Plage : `final_reputation_score` ∈ **0.0 – 100.0** ; `kyb_score` ∈ **0 – 100** ;
  `average_rating` ∈ **1.0 – 5.0** (ou `null` si aucun avis).

## 2. Endpoint

| Méthode | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/admin/reputation-score/{entreprise_id}` | Admin (`get_admin_user`) | Recalcule et retourne le score de réputation au format stable (idem §3). |
| GET | `/api/admin/enterprises/{id}` | Admin | Détail avec `trustScoreDetails` (décomposé, format fiabilité). |

## 3. Artefact JSON — contrat stable

```json
{
  "kyb_score": 100,
  "average_rating": 4.7,
  "review_count": 12,
  "badges": ["VERIFIED", "TOP_EXPORTER"],
  "malus_count": 0,
  "final_reputation_score": 82.5
}
```

| Champ | Type | Description |
| --- | --- | --- |
| `kyb_score` | int (0–100) | Note KYB normalisée sur 100 (dérivée de la composante `kyb_verified` / 30 × 100). |
| `average_rating` | float (1.0–5.0) ou `null` | Note moyenne des avis reçus (dérivée de `avg_review_score` / 30 × 5). `null` si aucun avis. |
| `review_count` | int | Nombre d'avis reçus. |
| `badges` | string[] | Codes des badges actifs de l'entreprise (UPPER_SNAKE). |
| `malus_count` | int | Nombre de malus liés aux signalements ouverts (dérivé de `flags_penalty`, 1 malus = 5 points). |
| `final_reputation_score` | float (0.0–100.0) | Score global de réputation (= `score` du score de fiabilité). |

## 4. Règles de calcul

| Champ | Règle |
| --- | --- |
| `kyb_score` | `round((kyb_verified / 30) * 100)` — 100 si la dernière `KYBVerification` est `verified`, sinon 0. |
| `average_rating` | `round((avg_review_score / 30) * 5, 2)` — `null` si `avg_review_score` est 0. |
| `malus_count` | `abs(flags_penalty) // 5` — un signalement ouvert = 5 points de malus. |
| `final_reputation_score` | Valeur `score` déjà calculée et bornée à [0, 100] par `trust.py`. |

La source de vérité du score global est **la valeur stockée/calculée par
`trust.py`** : les champs dérivés (`kyb_score`, `average_rating`, `malus_count`)
ne sont que des projections lisibles pour l'admin.

## 5. Consommation

- Affichage admin : détail entreprise, cartes de réputation, filtres de liste.
- Ne pas recalculer de scoring côté front : consommer `final_reputation_score`
  et `badges` tels que fournis.

## 6. Versioning

- Contrat de l'artefact : **v1**, décrit en §3.
- Toute évolution doit mettre à jour `admin.py` (endpoint), ce document et
  prévenir les consommateurs (Stagiaire 3) avant mise en production.
