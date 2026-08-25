# Reliability Score — Spécification Technique

> **Destinataires** : Stagiaire 3 / Agent IA de Matching  
> **Endpoint** : `GET /admin/companies/:id/reputation-score`  
> **Version** : 1.0.0  
> **Dernière mise à jour** : 2026-08-24

---

## 1. Objectif

Ce document décrit le format stable du **score de fiabilité / réputation** produit par le module Trust & Safety (Admin Dashboard).  
Ce score est consommé par l'**Agent IA de Matching** pour prioriser et filtrer les entreprises lors des recommandations d'opportunités commerciales.

---

## 2. Endpoint

```http
GET /admin/companies/:id/reputation-score
Authorization: Bearer <admin_jwt_token>
```

### Paramètres

| Paramètre | Type   | Requis | Description                    |
|-----------|--------|--------|--------------------------------|
| `id`      | UUID   | ✅     | Identifiant unique de l'entreprise |

### Authentification
- **Guard** : `AccessTokenGuard` + `RolesGuard`
- **Rôle requis** : `ADMIN`
- Retourne `401` si le token est absent ou invalide
- Retourne `403` si le rôle n'est pas ADMIN
- Retourne `404` si l'entreprise n'existe pas

---

## 3. Contrat JSON — Structure de la réponse

```json
{
  "company_id":             "3203f19e-e763-426b-9c24-b14316d84878",
  "kyb_score":              75,
  "average_rating":         4.3,
  "review_count":           17,
  "badges":                 ["ENTREPRISE_VERIFIEE", "TOP_EXPORTATEUR"],
  "malus_count":            1,
  "final_reputation_score": 68
}
```

### Description des champs

| Champ                   | Type            | Plage       | Description |
|-------------------------|-----------------|-------------|-------------|
| `company_id`            | `string (UUID)` | —           | Identifiant de l'entreprise |
| `kyb_score`             | `number`        | 0 – 100     | Score KYB : ratio d'items vérifiés × 100. **0** si aucune vérification KYB effectuée |
| `average_rating`        | `number|null`   | 1.0 – 5.0   | Note moyenne des avis (arrondie à 2 décimales). **null** si aucun avis |
| `review_count`          | `number`        | ≥ 0         | Nombre total d'avis. Informatif uniquement — n'entre pas dans la formule |
| `badges`                | `string[]`      | tableau     | Liste des types de badges actifs. Vide `[]` si aucun badge |
| `malus_count`           | `number`        | ≥ 0         | Nombre d'événements négatifs (`REJECTION` dans `moderation_history`). Chaque malus retire 5 points |
| `final_reputation_score`| `number`        | 0 – 100     | Score final **entier**, calculé selon la formule ci-dessous. Borné entre 0 et 100 |

---

## 4. Formule de calcul

### Scores intermédiaires

```
rating_score = (average_rating / 5) × 100    → 0 si average_rating est null
badge_score  = min(badges.length × 20, 100)  → plafonné à 100
```

### Score final

```
final_reputation_score = max(0, min(100, round(
    0.5 × kyb_score
  + 0.3 × rating_score
  + 0.2 × badge_score
  - 5   × malus_count
)))
```

### Pondération


| Composante | Poids | Justification Métier |
|---|---|---|
| **KYB Documentaire** | **50%** | La vérification juridique et administrative est le socle de confiance prioritaire pour le commerce international. |
| **Note Moyenne des Avis** | **30%** | Le retour d'expérience des partenaires commerciaux reflète la fiabilité opérationnelle. |
| **Badges de Confiance** | **20%** | Les distinctions accordées manuellement par l'admin valorisent les profils d'excellence. |
| **Malus (Rejets)** | **-5 pts / rejet** | Chaque incident de rejet pénalise la réputation globale. |

---


| Composante     | Poids | Détail |
|----------------|-------|--------|
| KYB            | 50 %  | Fiabilité documentaire de l'entreprise |
| Avis clients   | 30 %  | Réputation perçue par les partenaires |
| Badges         | 20 %  | Distinctions accordées par l'admin |
| Malus          | −5 pts / malus | Pénalité par rejet de dossier |

---

## 5. Valeurs et cas limites

| Situation                              | `kyb_score` | `average_rating` | `badges` | `malus_count` | `final_reputation_score` |
|----------------------------------------|-------------|------------------|----------|---------------|--------------------------|
| Entreprise parfaite (tous critères max)| 100         | 5.0              | 5+       | 0             | **100**                  |
| Nouveau dossier (rien de renseigné)    | 0           | null             | []       | 0             | **0**                    |
| KYB complet, aucun avis, aucun badge   | 100         | null             | []       | 0             | **50**                   |
| Bon KYB, bonne note, 2 badges, 1 malus | 80          | 4.0              | 2        | 1             | **67**                   |
| Score négatif avant borne              | 0           | null             | []       | 5             | **0** (borné à 0)        |
| Score très élevé avant borne           | 100         | 5.0              | 10       | 0             | **100** (borné à 100)    |



| Cas | KYB | Note Avis | Badges | Malus | Calcul brut | Score Final |
|---|---|---|---|---|---|---|
| **Profil Idéal** | 100% | 5.0/5 (50 avis) | 5 badges | 0 | $50 + 30 + 20 - 0$ | **100** |
| **Nouvelle Entreprise (vierge)** | 0% | null (0 avis) | [] | 0 | $0 + 0 + 0 - 0$ | **0** |
| **KYB Validé sans avis** | 100% | null (0 avis) | [] | 0 | $50 + 0 + 0 - 0$ | **50** |
| **Profil Établi Standard** | 80% | 4.0/5 (10 avis) | 2 badges | 1 rejet | $40 + 24 + 8 - 5$ | **67** |
| **Profil Dégradé** | 20% | 1.5/5 (3 avis) | [] | 3 rejets | $10 + 9 + 0 - 15 = 4$ | **4** |

---
### Détail du calcul — exemple n°4

```
kyb_score      = 80
average_rating = 4.0  → rating_score = (4.0 / 5) × 100 = 80
badges         = 2    → badge_score  = min(2 × 20, 100) = 40
malus_count    = 1

raw = 0.5×80 + 0.3×80 + 0.2×40 - 5×1
    = 40 + 24 + 8 - 5
    = 67

final_reputation_score = max(0, min(100, round(67))) = 67
```

---

## 6. Types de badges disponibles

| Valeur                  | Signification |
|-------------------------|---------------|
| `ENTREPRISE_VERIFIEE`   | Identité et documents vérifiés par l'admin |
| `TOP_EXPORTATEUR`       | Performance export reconnue |
| `PARTENAIRE_CERTIFIE`   | Partenariat certifié avec la plateforme |
| `ENGAGEMENT_QUALITE`    | Engagement qualité validé |

---

## 7. Définition du malus

**Version actuelle** : seul un `REJECTION` (rejet du dossier d'inscription) dans la table `moderation_history` compte comme malus pour l'entreprise.

```
malus_count = COUNT(moderation_history)
  WHERE entity_type = 'COMPANY'
    AND entity_id   = :company_id
    AND action_type = 'REJECTION'
```

> ⚠️ La suspension d'un utilisateur (`entity_type = USER`) **ne compte pas** comme malus de l'entreprise.  
> D'autres types de malus pourront être définis dans une version future du CDC.

---

## 8. Règles de stabilité pour l'Agent IA

1. **Le score est déterministe** : pour des données identiques, le même score sera toujours retourné.
2. **Le score est un entier** : toujours arrondi avec `Math.round()`, jamais de décimale.
3. **Bornes strictes** : toujours dans `[0, 100]` grâce au `max(0, min(100, ...))`.
4. **`review_count` est informatif** : il ne rentre pas dans la formule, mais peut être utilisé pour pondérer la confiance en `average_rating` côté Agent IA.
5. **`average_rating = null`** signifie "aucun avis" et non "note de 0". L'Agent IA doit traiter ces deux cas différemment.

---

## 9. Exemple complet d'appel

### Requête

```http
GET /admin/companies/3203f19e-e763-426b-9c24-b14316d84878/reputation-score
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Réponse 200 OK

```json
{
  "company_id":             "3203f19e-e763-426b-9c24-b14316d84878",
  "kyb_score":              80,
  "average_rating":         4.0,
  "review_count":           12,
  "badges":                 ["ENTREPRISE_VERIFIEE", "TOP_EXPORTATEUR"],
  "malus_count":            1,
  "final_reputation_score": 67
}
```

### Réponse 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Company not found"
}
```
## 10. Recommandations pour l'Agent IA (Stagiaire 3)

1. **Gestion de l'absence d'avis** : Une valeur `average_rating: null` avec `review_count: 0` n'est pas une "mauvaise" note, c'est une entreprise nouvelle. Vous pouvez utiliser `review_count` comme facteur de confiance statistique.
2. **Seuils recommandés pour le matching** :
   - `score ≥ 75` : Profil hautement recommandé (Partenaire de confiance).
   - `50 ≤ score < 75` : Profil standard vérifié.
   - `score < 50` : Profil nécessitant des précautions (KYB incomplet ou peu d'historique).
