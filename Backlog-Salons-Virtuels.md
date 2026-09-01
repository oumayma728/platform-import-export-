# Backlog – Module Salons Virtuels

## Epic 1 : Gestion des salons

### Story 1.1 : Créer un salon
- En tant qu’administrateur, je peux créer un salon avec :
  - thème,
  - catégorie,
  - dates de début et de fin,
  - prix du stand.
- Critères d’acceptation :
  - le salon est enregistré en statut `BROUILLON`,
  - les dates sont validées (début < fin),
  - le prix du stand est positif.

### Story 1.2 : Publier et clôturer un salon
- En tant qu’administrateur, je peux :
  - publier un salon,
  - clôturer un salon.
- Critères d’acceptation :
  - le salon passe à `PUBLIE` puis `EN_COURS` automatiquement à la date de début,
  - le salon passe à `TERMINE` à la date de fin ou à la clôture manuelle,
  - seul un salon `PUBLIE` est visible pour les importateurs.

### Story 1.3 : Suivre les salons et les statistiques
- En tant qu’administrateur, je peux consulter :
  - le nombre de visiteurs,
  - le nombre de RDV pris,
  - le taux de conversion des stands.
- Critères d’acceptation :
  - statistiques globales par salon,
  - liste des stands et statuts de paiement.

## Epic 2 : Réservation de stand exportateur

### Story 2.1 : Demander un stand
- En tant qu’exportateur, je peux demander un stand dans un salon publié.
- Critères d’acceptation :
  - le stand est créé avec le statut `EN_ATTENTE_PAIEMENT`,
  - l’exportateur renseigne ses informations entreprise, produits et certifications.

### Story 2.2 : Paiement du stand
- En tant qu’exportateur, je peux payer la réservation du stand.
- Critères d’acceptation :
  - le paiement est enregistré,
  - le statut du stand passe à `EN_ATTENTE_VALIDATION` après paiement.

### Story 2.3 : Upload des médias et documents
- En tant qu’exportateur, je peux :
  - téléverser une vidéo de présentation,
  - téléverser des documents complémentaires.
- Critères d’acceptation :
  - la vidéo est requise ou fortement recommandée,
  - les documents sont visibles par l’administrateur.

### Story 2.4 : Validation du stand
- En tant qu’administrateur, je peux valider ou rejeter une inscription de stand.
- Critères d’acceptation :
  - le statut passe à `VALIDE` ou `REJETE`,
  - le stand validé apparaît sur la page du salon.

## Epic 3 : Expérience importateur

### Story 3.1 : Consulter un salon
- En tant qu’importateur, je peux voir la page d’accueil du salon et la liste des stands.
- Critères d’acceptation :
  - tous les stands validés sont affichés,
  - la page affiche les dates et le thème du salon.

### Story 3.2 : Parcourir les stands
- En tant qu’importateur, je peux visiter chaque page de stand.
- Critères d’acceptation :
  - accès gratuit pour tous les stands,
  - affichage de la vidéo et des documents du stand.

### Story 3.3 : Demander un RDV
- En tant qu’importateur, je peux demander un rendez-vous auprès d’un exportateur.
- Critères d’acceptation :
  - le RDV est créé en statut `PROPOSE`,
  - l’exportateur reçoit une notification ou un message.

## Epic 4 : Gestion des rendez-vous

### Story 4.1 : Workflow RDV exportateur
- En tant qu’exportateur, je peux :
  - confirmer un RDV,
  - proposer un autre créneau,
  - refuser.
- Critères d’acceptation :
  - le statut passe à `CONFIRME`, `REFUSE` ou reste `PROPOSE`,
  - une nouvelle proposition met à jour le RDV.

### Story 4.2 : Canal d’échange RDV
- En tant que participant au RDV, je peux accéder à un canal d’échange dédié.
- Critères d’acceptation :
  - messagerie texte incluse,
  - option d’échange vocal prévue (ou mentionnée pour V2),
  - aucun quota de chat n’est consommé.

### Story 4.3 : Notifications RDV
- En tant que participant, je reçois un rappel avant le RDV.
- Critères d’acceptation :
  - rappel envoyé par email et/ou notification,
  - deux rappels possibles : confirmation et 15-30 minutes avant.

## Epic 5 : Visibilité et communication

### Story 5.1 : Diffuser le salon sur la plateforme
- En tant que plateforme, je peux afficher le salon dans une section "Salons en cours".
- Critères d’acceptation :
  - un salon publié apparaît dans les annonces,
  - un lien de partage direct est disponible.

### Story 5.2 : Notification ciblée aux importateurs
- En tant que plateforme, je peux notifier les importateurs abonnés à la catégorie.
- Critères d’acceptation :
  - email envoyé aux importateurs concernés,
  - les notifications sont associées à la catégorie du salon.

## Epic 6 : Dépendances et intégrations

### Story 6.1 : Vérifier l’éligibilité exportateur
- En tant que système, je vérifie que l’exportateur possède un profil entreprise valide.
- Critères d’acceptation :
  - la réservation de stand est autorisée seulement si le profil est validé,
  - l’information provient du backend existant.

### Story 6.2 : Intégration du paiement
- En tant que système, je prends en charge le paiement du stand.
- Critères d’acceptation :
  - réutilisation possible de Stripe existant,
  - si nécessaire, un paiement simple peut être implémenté pour V1.

## Suggestions de priorisation

- Priorité haute : Story 1.1, Story 2.1, Story 2.2, Story 3.1, Story 3.2, Story 4.1
- Priorité moyenne : Story 2.3, Story 2.4, Story 3.3, Story 4.3, Story 5.1
- Priorité basse : Story 4.2, Story 5.2

## Notes pour l’équipe

- Commencer par le modèle de données et les APIs backend.
- Prévoir une interface de validation de stand simple pour l’administrateur.
- Livrer un MVP fonctionnel avant d’ajouter des options premium ou des rdv vocaux avancés.

---

> Ce backlog peut être importé dans un outil de gestion de projet (Jira, Trello, Asana) en tant que listes de user stories et tâches.