Documentation — Logique de scoring de l'Agent IA de Matching



Projet : Plateforme Import/Export — Module Matching (Stagiaire 3)

Version : V1 (base algorithmique)







1\. Objectif



Pour une annonce donnée (offre ou demande), le système calcule un score de pertinence entre 0 et 1 vis-à-vis de chaque annonce candidate du type opposé, puis retourne un classement décroissant. Le score combine 5 critères indépendants, chacun normalisé sur \[0, 1], puis agrégés par une somme pondérée.



score\_global = Σ (poids\_critère × score\_critère)



Les scores et poids sont conçus pour être transparents et ajustables, conformément à la logique d'amélioration continue prévue en section 6 du CDC.





2\. Poids actuels (V1 — provisoires)



CritèrePoidsJustification provisoireCorrespondance produit/catégorie0.30Critère jugé le plus déterminant : un mauvais match produit rend les autres critères inutilesAdéquation prix/quantité0.20Critère économique direct, importance moyenne-hauteProximité géographique/logistique0.20Impacte la faisabilité réelle de la transactionFiabilité du partenaire0.15Important mais secondaire à la pertinence de l'offre elle-mêmeDélais de disponibilité0.15Contrainte binaire (compatible/incompatible) plus qu'un facteur de nuance



⚠️ Ces valeurs n'ont pas de justification empirique à ce stade — elles reflètent une intuition métier de départ. Elles sont stockées dans une constante isolée (POIDS dans scoring.py) précisément pour pouvoir être modifiées facilement, sans toucher au reste du code, une fois validées ou apprises à partir de données réelles.





3\. Détail des 5 critères



3.1 Correspondance produit/catégorie — poids 0.30



Méthode : similarité sémantique par embeddings (modèle paraphrase-multilingual-MiniLM-L12-v2, via sentence-transformers).





Si les libellés produit sont strictement identiques (insensible à la casse) → score = 1.0 (raccourci pour éviter un calcul inutile et un bruit numérique).

Sinon, on encode les deux libellés produit en vecteurs et on calcule leur similarité cosinus.





Pourquoi les embeddings plutôt qu'une correspondance texte stricte : une comparaison exacte ("jeans" == "pantalons denim") échoue à rapprocher deux produits qui désignent en réalité la même chose. Le modèle sémantique capture cette proximité sans dictionnaire de synonymes à maintenir manuellement.



Limite connue : le modèle est générique (non spécialisé import/export) ; des faux positifs/négatifs sont possibles sur du vocabulaire très technique ou sectoriel. À réévaluer si des erreurs de matching sont signalées.



3.2 Adéquation prix/quantité — poids 0.20



Méthode : moyenne de deux sous-scores.





Écart prix : 1 - (|prix\_a - prix\_b| / max(prix\_a, prix\_b)) — plus l'écart relatif est faible, plus le score est proche de 1.

Couverture quantité : min(qté\_a, qté\_b) / max(qté\_a, qté\_b) — pénalise un déséquilibre important entre l'offre et la demande.





Limite connue : ne tient pas compte de la marge de négociation habituelle du secteur (un écart de prix acceptable peut varier selon le produit). Un seuil de tolérance par catégorie pourrait être introduit ultérieurement.



3.3 Proximité géographique et logistique — poids 0.20



Méthode : moyenne de trois sous-scores normalisés à partir de données fournies par l'intégration logistique du Backend (distance, coût, délai de transport) :





score\_distance = 1 - distance\_km / 2000

score\_cout = 1 - cout\_transport / 1500

score\_delai = 1 - delai\_jours / 15





Valeurs de référence (2000 km / 1500 € / 15 jours) : hypothèses provisoires, choisies comme "pire cas raisonnable" à l'échelle régionale. Elles devront être recalibrées avec de vraies données logistiques une fois l'intégration Backend disponible.



Cas de donnée manquante : si aucune route logistique n'est disponible (mock ou service indisponible), le score retourne une valeur neutre de 0.5, pour ne pas pénaliser ni avantager injustement un match tant que la donnée réelle n'est pas connue.



3.4 Fiabilité du partenaire — poids 0.15



Méthode : reprise directe du reputation\_score (0 à 1) fourni par le profil entreprise (module Trust, Stagiaire 4).



Cas de donnée manquante : si le profil entreprise n'est pas trouvé, score neutre-bas de 0.3 — choix délibéré de légèrement désavantager les profils inconnus plutôt que de les traiter à égalité avec des profils vérifiés.



Limite connue : ne combine pas encore les certifications ni l'historique du nombre de transactions (nb\_transactions, certifications), pourtant déjà disponibles dans ProfilEntreprise. Amélioration possible en V2.



3.5 Délais de disponibilité — poids 0.15



Méthode : compare la date de disponibilité de l'exportateur à la date limite de l'importateur.





Si l'offre est disponible après la date limite → score = 0.0 (incompatibilité stricte).

Sinon, score proportionnel à la marge de sécurité : min(1.0, marge\_jours / MARGE\_MAX\_JOURS), avec MARGE\_MAX\_JOURS = 30 (hypothèse provisoire).





Cas de donnée manquante : score neutre de 0.5 si l'une des deux dates n'est pas renseignée.



Historique de conception : une première version utilisait un score plancher arbitraire (0.7 + marge/100), qui écrasait la nuance dès qu'une marge de \~30 jours était atteinte. Version corrigée pour une progression strictement linéaire, plus honnête et plus discriminante.





4\. Gestion des données manquantes — principe général



Chaque critère retourne une valeur neutre (ni pénalisante ni avantageuse) quand la donnée externe nécessaire n'est pas disponible, plutôt que de faire échouer le calcul ou de retourner 0 par défaut. Ce choix permet à l'agent de fonctionner dès maintenant avec des données mockées ou partielles, en attendant l'intégration complète avec le Backend et le module Trust.



CritèreValeur neutreCas déclencheurGéo-logistique0.5Pas de route logistique connue entre les deux paysFiabilité0.3Profil entreprise introuvableDélais0.5Date de disponibilité ou date limite manquante





5\. Préparation pour l'amélioration continue 



Chaque match calculé est enregistré avec l'ensemble de ses scores détaillés (detail\_scores), un horodatage, et un statut (propose, à terme accepte/refuse). Cette collecte vise à constituer, à terme, un jeu de données étiqueté permettant :





De valider ou recalibrer les poids actuels sur la base de matchs réellement conclus.

D'envisager un modèle supervisé (ex. régression logistique) prenant les 5 scores en entrée pour prédire une probabilité d'acceptation, en complément — voire en remplacement partiel — de la pondération manuelle.





Aucune donnée réelle de transaction n'existe à ce stade ; cette étape reste donc conditionnée à l'avancement de la plateforme.







