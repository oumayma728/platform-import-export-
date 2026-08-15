Algorithme de Matching — Documentation technique



Projet : Plateforme Import/Export — Module Matching (Stagiaire 3) Fichiers concernés : app/scoring.py, app/models.py



1\. Vue d'ensemble



Pour un Listing source (offre ou demande), l'algorithme compare chaque Listing candidat du type opposé et calcule un score global entre 0 et 100, obtenu en combinant 5 critères indépendants (chacun normalisé sur \[0, 1]) selon une pondération fixe.



score\_global = 100 × Σ (poids\_critère × score\_critère)



Le résultat est renvoyé sous forme d'un objet MatchResult contenant le score global, le détail par critère (MatchingCriteria), et une explication textuelle générée automatiquement.



2\. Poids actuels

Critère	                 Poids	     Fonction

Produit / catégorie	 25%	     score\_produit

Prix / quantité	         25%	     score\_prix\_quantite

Géo-logistique	         25%	     score\_geo\_logistique

Fiabilité du partenaire	 15%	     score\_fiabilite

Délais de disponibilité	 10%	     score\_delais



&#x20;Ces poids sont provisoires. Les tests menés sur un jeu de données élargi (voir docs/test\_results.md) ont révélé qu'un score produit faible ne suffit pas toujours à écarter un candidat non pertinent — une révision de cette pondération est en discussion avec l'encadrant.



3\. Détail des critères

3.1 Produit / catégorie (25%)



Combine 3 sous-scores :



Sous-score	                Méthode	                                                        Poids interne

Correspondance exacte	        match\_exact() — comparaison stricte insensible à la casse	— (court-circuite si vrai)

Similarité textuelle	        score\_fuzzy() — rapidfuzz.fuzz.token\_sort\_ratio, tolère 

&#x09;		        les variations de formulation	                                70%

Correspondance de catégorie	score\_categorie() — égalité stricte de catégorie	        30%



python

score\_produit = 1.0                                         si match exact

score\_produit = score\_fuzzy × 0.7 + score\_categorie × 0.3   sinon





3.2 Prix / quantité (25%)

Moyenne de deux sous-scores :



Écart prix : 1 - |prix\_a - prix\_b| / max(prix\_a, prix\_b)

Couverture quantité : min(qté\_a, qté\_b) / max(qté\_a, qté\_b)





3.3 Géo-logistique (25%)



Pondération interne : distance 30%, coût 35%, délai transport 35%. Chaque sous-critère est normalisé par rapport à une valeur de référence (provisoire) :



score\_distance = 1 - distance\_km / 2000

score\_cout     = 1 - cout\_transport / 1500

score\_delai    = 1 - delai\_transport\_jours / 15



score\_geo\_logistique = score\_distance×0.30 + score\_cout×0.35 + score\_delai×0.35



Donnée manquante (pas de route logistique mockée) → score neutre 0.5.



3.4 Fiabilité du partenaire (15%)



Pondération interne : réputation 50%, certifications 30%, historique de transactions 20%.



score\_certifications = moyenne pondérée des certifications reconnues détenues

score\_historique      = min(1.0, nb\_transactions / 50)



score\_fiabilite = reputation\_score×0.50 + score\_certifications×0.30 + score\_historique×0.20



Profil introuvable → score neutre-bas 0.3.



3.5 Délais de disponibilité (10%)

si date\_disponibilite <= date\_limite :

&#x20;   marge = (date\_limite - date\_disponibilite).jours

&#x20;   score\_delais = min(1.0, 0.7 + marge / 100)

sinon :

&#x20;   score\_delais = 0.0



Donnée manquante → score neutre 0.5.



4\. Explication générée automatiquement



Chaque MatchResult inclut un champ explication (texte), généré par generer\_explication() à partir de seuils fixes appliqués à chaque critère (ex. "produit correspondant exactement" si score\_produit >= 0.9). C'est une transformation déterministe, pas un texte généré par IA — mêmes scores en entrée = même explication en sortie.



5\. Limites connues

Les valeurs de référence (2000km, 1500€, 15 jours, 50 transactions) sont des hypothèses de départ, à recalibrer avec de vraies données.

Le poids du critère produit (25%) peut être insuffisant pour écarter des candidats hors-sujet — voir docs/test\_results.md pour les cas observés (scénarios D003, D005, D008).

score\_fuzzy (comparaison textuelle) peut donner des faux positifs sur des libellés partageant une structure similaire sans être sémantiquement proches.

6\. Références

Code source : app/scoring.py

Modèles de données : app/models.py

Résultats de validation : docs/test\_results.md

Guide d'intégration Frontend : docs/INTEGRATION\_GUIDE.md

