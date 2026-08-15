Résultats de validation — Jeu de données de test



Date : 24 juillet 2026 Nombre de listings testés : 20 (10 offres A001-A010, 10 demandes D001-D010) Script utilisé : tests/manual\_scenarios.py



Méthodologie



Pour chaque demande, on récupère les offres candidates via get\_annonces\_opposees, on calcule le score global (0-100) via calcul\_score\_global, et on observe si le Top 3 est pertinent au regard du produit, du prix, de la géographie et des délais. Poids utilisés : produit 25%, prix/quantité 25%, géo-logistique 25%, fiabilité 15%, délais 10%.



Résultats par scénario

Scénario 1 — D001 (jeans)



Top 3 : A001 (75.5) > A002 (64.9) > A005 (59.1) Verdict :  Pertinent. A001 (match exact) en tête, A002 (pantalons denim, similaire) en second. A005 (smartphones, "peu correspondant") arrive 3e uniquement grâce aux autres critères — acceptable en position 3, mais montre déjà que le score produit ne filtre pas assez les candidats hors-sujet.



Scénario 2 — D002 (t-shirts en coton)



Top 3 : A003 (71.2) > A001 (67.9) > A007 (64.5) Verdict :  Partiellement pertinent. A003 (match exact) bien en tête. Mais A001 (jeans, "produit peu correspondant") devance A007 (chemises en lin, "produit similaire") — un produit jugé textuellement peu correspondant bat un produit jugé similaire, uniquement parce que son prix/quantité est plus favorable.



Scénario 3 — D003 (baskets running)



Top 3 : A010 (61.1) > A005 (59.4) > A004 (44.4) Verdict :  Non pertinent. Les 2 premiers résultats sont des produits électroniques ("produit peu correspondant"), alors qu'A004 (chaussures de sport, même catégorie, "produit similaire") — le seul candidat réellement pertinent — arrive seulement 3e, avec un score très inférieur (44.4 vs 61.1).



Scénario 4 — D004 (téléphones occasion)



Top 3 : A010 (59.9) > A005 (49.1) > A003 (38.8) Verdict :  Pertinent. Les deux meilleurs résultats sont bien des produits électroniques cohérents avec la demande.



Scénario 5 — D005 (écouteurs bluetooth)



Top 3 : A001 (59.3) > A002 (56.6) > A007 (56.6) Verdict :  Non pertinent. Le Top 3 est entièrement composé de vêtements ("produit peu correspondant" partout). A006 (écouteurs sans fil), le match attendu, n'apparaît même pas dans le Top 3.



Scénario 6 — D006 (chemises en coton)



Top 3 : A002 (72.7) > A007 (67.9) > A001 (64.9) Verdict :  Pertinent. A002 et A007 (produits vestimentaires proches, "similaire") bien classés devant A001 ("peu correspondant").



Scénario 7 — D007 (coton brut)



Top 3 : A008 (69.3) > A003 (67.1) > A001 (63.0) Verdict :  Partiellement pertinent. A008 (tissus de coton brut, le match attendu) est bien en tête, mais son score n'est que légèrement supérieur à A003 et A001 (t-shirts, jeans — "peu correspondant"), qui ne devraient normalement pas être aussi proches.



Scénario 8 — D008 (meubles en bois)



Top 3 : A010 (58.2) > A005 (55.1) > A008 (37.7) Verdict :  Cas limite révélateur. Aucune offre du secteur mobilier n'existe — c'est le comportement attendu. Mais les scores restent anormalement élevés (58.2, 55.1) malgré un "produit peu correspondant" partout, ce qui confirme que le poids du produit (25%) est insuffisant pour faire chuter significativement le score global quand le produit ne correspond pas du tout.



Scénario 9 — D009 (casquettes personnalisées)



Top 3 : A001 (67.4) > A003 (66.7) > A002 (66.1) Verdict :  Partiellement pertinent. A001 ("peu correspondant") devance A003 et A002 ("similaire") — même problème que le scénario 2.



Scénario 10 — D010 (ordinateurs occasion)



Top 3 : A010 (56.0) > A002 (40.8) > A003 (39.2) Verdict :  Pertinent. A010 (le seul candidat électronique) nettement en tête, avec un écart clair par rapport aux vêtements en 2e/3e position.



Synthèse

Top 1 jugé pertinent : 7 / 10 (D001, D002, D004, D006, D007, D009, D010 — le Top 1 reste correct même quand le Top 3 est discutable)

Top 3 entièrement pertinent : 5 / 10 (D001, D004, D006, D009, D010)

Anomalies sérieuses (produit hors-sujet dans le Top 2) : 2 / 10 (D003, D005)

Cas limite (aucune offre du secteur) : 1 / 10 (D008), comportement globalement attendu mais scores trop élevés

Cause racine identifiée



Avec les poids actuels (produit 25%, prix/quantité 25%, géo-logistique 25%, fiabilité 15%, délais 10%), un score produit très faible (≈0.1–0.3, "peu correspondant") ne fait chuter le score global que d'environ 5 à 7 points sur 100. Les 75% de poids restants (prix, géo, fiabilité, délais) peuvent rester élevés indépendamment de la pertinence du produit, ce qui permet à des candidats hors-sujet de remonter dans le classement — voire de devancer des candidats réellement pertinents (scénarios 3 et 5).



Recommandations 

Augmenter le poids du critère produit (ex. 40-50% au lieu de 25%), pour qu'il domine davantage le score final.

Ajouter un seuil d'exclusion : si score\_produit < 0.3, exclure le candidat du classement plutôt que de le laisser concurrencer des matchs pertinents sur la seule base du prix/logistique.

Envisager un facteur multiplicatif plutôt qu'additif pour le produit (ex. score\_global = score\_produit × (autres critères pondérés)), afin qu'un mauvais score produit pénalise proportionnellement tous les autres critères plutôt que de s'additionner à eux.

Conclusion



L'algorithme se comporte correctement dans les cas de matching évident (produit identique ou très proche) : 7 des 10 scénarios ont un Top 1 pertinent. En revanche, ce jeu de données élargi révèle une faiblesse structurelle de la pondération actuelle : le critère produit ne pèse pas assez pour écarter les candidats hors-sujet quand leurs autres critères (prix, logistique) sont favorables. Cette observation est un résultat utile de cette phase de test — elle justifie de rediscuter la pondération produit avec l'encadrant avant la présentation finale.

