# les résultats dans un fichier test_results.md avec explications des scores pour chaque scenario

Ce document résume les tests effectués sur l'algorithme de matching, avec les scénarios clés testés et l'analyse de pertinence des résultats.

## Méthodologie

- 25 listings mockés créés (offres et demandes), répartis sur plusieurs secteurs : vêtements, électronique, mobilier, cosmétiques, plus un cas de test "sans correspondance possible" (accessoires)
- Pour chaque scénario, on appelle `trouver_correspondances()` (services/matching.py) et on vérifie que le Top 3 a du sens
- Le tri applique une priorité en 2 niveaux : (1) pertinence du produit — match exact (priorité 2) > même catégorie (priorité 1) > catégorie différente (priorité 0), (2) score global pour départager à l'intérieur de chaque niveau

## Scénario 1 : Jeans (demande-001, France)

| Rang | Offre | Score | Priorité | Explication |
|---|---|---|---|---|
| 1 | offre-001 | 92.835 | 2 | Produit identique (Jeans), Maroc proche, prix dans le budget |
| 2 | offre-002 | 70.6375 | 1 | Variante proche (Jeans coupe droite), Turquie |
| 3 | offre-003 | 62.8325 | 1 | Jeans slim, Bangladesh (plus loin) |

**Résultat : pertinent.** Le meilleur match combine produit identique et proximité géographique.

## Scénario 2 : T-shirt coton (demande-002, France)

| Rang | Offre | Score | Priorité | Explication |
|---|---|---|---|---|
| 1 | offre-004 | 61.8225 | 1 | T-shirt coton bio, Vietnam — bon match produit |
| 2 | offre-001 | 61.1675 | 1 | Jeans — même catégorie mais produit différent |
| 3 | offre-002 | 59.7975 | 1 | Jeans coupe droite |

**Résultat : globalement pertinent, limite connue.** Aucun match exact disponible dans les données pour ce scénario, donc toutes les offres de la catégorie "vêtements" sont à priorité égale (1). Le meilleur produit (t-shirt) arrive bien en tête, mais des jeans restent proches en score — limite du fuzzy matching textuel, documentée dans `CHOIX_TECHNIQUES.md`.

## Scénario 3 : Jeans slim (demande-003, Espagne)

| Rang | Offre | Score | Priorité | Explication |
|---|---|---|---|---|
| 1 | offre-003 | 64.5975 | 2 | Match EXACT (Jeans slim), Bangladesh |
| 2 | offre-001 | 76.4575 | 1 | Jeans générique, meilleur score global mais produit moins précis |
| 3 | offre-002 | 70.595 | 1 | Jeans coupe droite |

**Résultat : pertinent après correction.** Initialement, le match exact était mal classé (3ème) car pénalisé par la distance géographique (Bangladesh). Le tri en 2 niveaux (priorité produit d'abord) place désormais le match exact en tête, conformément à l'intuition métier, malgré un score brut inférieur à offre-001.

## Scénario 4 : Écouteurs sans fil (demande-004, Allemagne)

| Rang | Offre | Score | Priorité | Explication |
|---|---|---|---|---|
| 1 | offre-005 | 64.7225 | 2 | Match exact, Chine |
| 2 | offre-007 | 61.58 | 1 | Câbles USB (même catégorie électronique) |
| 3 | offre-006 | 59.6425 | 1 | Chargeurs USB-C (même catégorie) |

**Résultat : pertinent.**

## Scénario 5 : Chargeurs USB-C (demande-005, Italie)

| Rang | Offre | Score | Priorité | Explication |
|---|---|---|---|---|
| 1 | offre-006 | 78.0025 | 2 | Match exact, Corée du Sud |
| 2 | offre-007 | 62.995 | 1 | Câbles USB (même catégorie) |
| 3 | offre-005 | 49.65 | 1 | Écouteurs sans fil (même catégorie) |

**Résultat : pertinent.**

## Scénario 6 : Chaises en bois (demande-006, France)

| Rang | Offre | Score | Priorité | Explication |
|---|---|---|---|---|
| 1 | offre-008 | 73.2075 | 1 | Chaises en teck, Indonésie |
| 2 | offre-010 | 54.7525 | 1 | Chaises artisanales, Nigeria |
| 3 | offre-009 | 49.8675 | 1 | Tables basses (même catégorie mobilier) |

**Résultat : pertinent.** Les 3 meilleurs résultats sont bien du mobilier. Aucun match exact disponible dans les données pour ce scénario.

## Scénario 7 : Savon naturel (demande-008, Italie)

| Rang | Offre | Score | Priorité | Explication |
|---|---|---|---|---|
| 1 | offre-012 | 75.455 | 2 | Match exact, Égypte |
| 2 | offre-011 | 66.0575 | 1 | Savon à l'huile d'argan (variante proche) |
| 3 | offre-006 | 10.922 | 0 | Chargeur USB-C (catégorie différente) |

**Résultat : pertinent.** Le verrou de pénalisation fonctionne bien : un produit totalement hors-catégorie obtient un score très bas (10.9) et une priorité 0, confirmant que le mauvais match est correctement identifié même s'il apparaît dans le Top 3 faute de meilleures alternatives.

## Scénario 8 : Montres suisses (demande-009, Suisse) — cas volontairement sans correspondance

| Rang | Offre | Score | Priorité | Explication |
|---|---|---|---|---|
| 1 | offre-016 | 10.981 | 0 | Samsung Galaxy S24 (aucun rapport) |
| 2 | offre-001 | 10.8575 | 0 | Jeans (aucun rapport) |
| 3 | offre-002 | 10.525 | 0 | Jeans coupe droite (aucun rapport) |

**Résultat : pertinent.** Aucune offre de montres n'existe dans les données de test. Tous les scores restent uniformément bas (≤ 11) et à priorité 0 — comportement attendu : l'algorithme ne "force" pas un mauvais match à paraître acceptable.

## Scénario 9 : MacBook Air M3 (demande-010, Royaume-Uni)

| Rang | Offre | Score | Priorité | Explication |
|---|---|---|---|---|
| 1 | offre-014 | 68.9575 | 2 | Match exact (M3), Chine |
| 2 | offre-007 | 59.8975 | 1 | Câbles USB (même catégorie) |
| 3 | offre-013 | 58.5475 | 1 | MacBook Air **M2** (modèle différent) |

**Résultat : pertinent.** Le modèle exact (M3) est bien classé en premier grâce à la priorité produit. Le modèle proche mais différent (M2) reste visible avec un score modéré plutôt qu'excellent — cohérent avec le principe que le système ne rejette jamais complètement une alternative raisonnable, mais la classe clairement en dessous du match parfait.

## Historique des corrections appliquées pendant la validation

Ce processus de test a révélé et permis de corriger plusieurs limites réelles de l'algorithme :

1. **Bug initial** : la catégorie pesait trop lourd dans le score produit, permettant à des produits très différents (ex: jeans proposés pour une recherche d'écouteurs) d'obtenir un score global élevé malgré tout
2. **Correction 1** : ajout d'un "verrou" dans `scoring_global` — si le score produit est trop bas (< 0.15), le score global entier est fortement pénalisé (× 0.2), peu importe les autres critères
3. **Correction 2** : ajout d'un tri en 2 niveaux (priorité produit, puis score) dans `trouver_correspondances()`, pour garantir qu'un match exact remonte toujours avant une simple variante, même si son score global brut est légèrement inférieur (voir scénario 3)

## Limites connues, documentées honnêtement

- Le score de similarité textuelle pure (`SequenceMatcher`) a une limite intrinsèque : deux produits différents de structure proche (ex: "chargeurs" vs "câbles", ou "jeans" vs "t-shirt") peuvent obtenir un score de similarité plus élevé que l'intuition humaine ne le suggérerait (voir scénario 2). Le tri en 2 niveaux atténue cet effet en pratique, mais ne l'élimine pas totalement dans le score brut.
- Les seuils utilisés (seuil du verrou à 0.15, seuil de similarité catégorie à 0.85, pondération interne 70%/30% catégorie/produit) sont des valeurs ajustées empiriquement sur les données de test disponibles, pas des constantes validées à grande échelle — voir `CHOIX_TECHNIQUES.md` pour le détail de chaque choix.
- La logique de tri par priorité vit actuellement dans `services/matching.py` (fonction `trouver_correspondances`), pas directement dans `scoring_global` — toute utilisation future de `scoring_global` seule ne bénéficiera pas de cette priorisation.

## Conclusion

Sur les 9 scénarios testés, couvrant plusieurs secteurs différents et incluant un cas volontairement sans solution, l'algorithme produit des classements cohérents avec l'intuition métier. Les correspondances exactes remontent systématiquement en tête grâce au système de priorité, et les mauvais matchs (catégorie différente) sont clairement identifiés par un score bas, même lorsqu'ils apparaissent dans le Top 3 faute d'alternative.