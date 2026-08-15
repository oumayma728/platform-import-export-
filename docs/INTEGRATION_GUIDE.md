Guide d'intégration Frontend — API de Matching



Destiné à : Stagiaire 1 (Frontend) Base URL (développement local) : http://127.0.0.1:8000 Documentation interactive : http://127.0.0.1:8000/docs



1\. Endpoint principal

POST /api/matching/find-matches



Recherche les meilleures correspondances pour un listing donné.



Body de la requête :



json

{

&#x20; "listing\_id": "D001"

}



Query parameters (optionnels) :



Paramètre	Type	Défaut	Description

limit	int	10	Nombre max de résultats par page (1-100)

offset	int	0	Décalage pour la pagination

top\_n	int	10	Nombre max de correspondances considérées avant pagination (1-100)

score\_min	float	0.0	Score global minimum à retourner (0-100)

pays	string | null	null	Filtre sur le pays du candidat

prix\_max	float | null	null	Filtre sur le prix unitaire maximum du candidat



Exemple d'appel complet :



POST /api/matching/find-matches?limit=5\&offset=0\&score\_min=50\&pays=Maroc

2\. Format de la réponse



Réponse 200 OK : une liste d'objets MatchResult, triée par score\_global décroissant.



json

\[

&#x20; {

&#x20;   "listing\_id": "A001",

&#x20;   "score\_global": 75.5,

&#x20;   "scores\_detailles": {

&#x20;     "produit": 1.0,

&#x20;     "prix\_quantite": 0.796,

&#x20;     "geo\_logistique": 0.4675,

&#x20;     "fiabilite": 0.593,

&#x20;     "delais": 1.0

&#x20;   },

&#x20;   "explication": "Produit correspondant exactement, prix et quantité compatibles, logistique coûteuse ou lente, fiabilité du partenaire incertaine, délais respectés avec marge confortable."

&#x20; }

]

Description des champs

Champ	Type	Description

listing\_id	string	Identifiant du listing candidat (l'offre ou la demande correspondante)

score\_global	float	Score de pertinence global, échelle 0 à 100

scores\_detailles	object	Détail des 5 critères, chacun entre 0 et 1 (voir MATCHING\_ALGORITHM.md)

explication	string	Résumé textuel généré automatiquement, en français



Note importante : score\_global est sur une échelle 0-100, tandis que chaque critère dans scores\_detailles reste sur une échelle 0-1. Ne pas confondre les deux lors de l'affichage (ex. barres de progression).



Liste vide (\[]) : réponse valide si aucun candidat ne correspond au listing (ex. aucun listing du type opposé, ou tous filtrés par score\_min/pays/prix\_max).



3\. Gestion des erreurs

404 Not Found — Listing introuvable



Déclenché si listing\_id fourni ne correspond à aucun listing existant.



json

{

&#x20; "detail": "Listing 'XYZ999' introuvable"

}



Recommandation Frontend : afficher un message clair du type "Cette annonce n'existe plus ou a été retirée."



422 Unprocessable Entity — Erreur de validation



Déclenché si :



listing\_id manquant ou de mauvais type dans le body

Un query parameter est hors des bornes autorisées (ex. limit=500 alors que le max est 100)

json

{

&#x20; "detail": \[

&#x20;   {

&#x20;     "loc": \["body", "listing\_id"],

&#x20;     "msg": "Field required",

&#x20;     "type": "missing"

&#x20;   }

&#x20; ]

}



Recommandation Frontend : ce cas ne devrait normalement pas arriver si le formulaire est bien validé côté client avant l'envoi — traiter comme une erreur technique inattendue (log + message générique).



Codes non gérés explicitement



Tout autre code (ex. 500 Internal Server Error) doit être traité comme une erreur serveur générique — afficher un message du type "Une erreur est survenue, veuillez réessayer." et, si possible, logger la réponse complète pour investigation côté Backend.



4\. Points d'attention pour l'intégration

Pas d'authentification requise à ce stade (V1, données mockées). À anticiper pour la version finale.

Les données actuelles sont mockées (app/data/\*.json) — les résultats changeront une fois connectés au vrai Backend.

Le champ explication est en français, pensé pour un affichage direct à l'utilisateur.

Pour toute question sur la logique de scoring affichée dans scores\_detailles, se référer à docs/MATCHING\_ALGORITHM.md.



5\. Contact



Pour toute question ou évolution nécessaire du format de réponse, contacter le Stagiaire 3 (module Matching) avant de modifier le contrat d'API.

