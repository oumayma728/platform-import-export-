# Cahier des Charges – Plateforme Import / Export Mondiale

## 1. Contexte du projet

La plateforme met en relation exportateurs et importateurs à l’échelle mondiale. Ce cahier des charges couvre uniquement le module "Salons Virtuels".

Un salon virtuel est un événement thématique en ligne :
- plusieurs exportateurs présentent leurs produits via un stand payant,
- les importateurs accèdent gratuitement au salon,
- ils peuvent consulter les stands, regarder les vidéos de présentation et demander des rendez-vous.

Ce rôle est transverse : backend (gestion des données, paiement, planification) et frontend (interface salon, stands, réservation).

## 2. Objectif du rôle

Construire un module indépendant permettant :
- la création et la gestion des salons virtuels,
- la réservation de stand par les exportateurs,
- la consultation du salon par les importateurs,
- la prise de rendez-vous (RDV) entre importateurs et exportateurs.

## 3. Principe général

- Un salon est créé autour d’un thème ou d’une catégorie de produits.
- Les exportateurs paient un tarif fixe pour réserver un stand.
- Les importateurs accèdent gratuitement au salon et à tous les stands.
- Le salon est actif pendant une période définie (par exemple 1 à 2 semaines).
- Chaque salon a une date de début et une date de fin.

## 4. Périmètre fonctionnel

### 4.1 Stand exportateur (V1 : stand standard uniquement)

Fonctionnalités à livrer :
- Paiement d’une redevance fixe pour réserver un stand.
- Formulaire d’inscription pour le stand :
  - informations entreprise,
  - produits,
  - certifications.
- Upload de vidéo de présentation du produit (obligatoire ou fortement recommandé).
- Upload de documents complémentaires : fiches techniques, catalogue, certificats.
- Page de stand publique consultable par tous les importateurs inscrits au salon.

Note : les formules premium sont hors périmètre V1.

### 4.2 Accès importateur

Fonctions attendues :
- Page d’accueil du salon listant tous les stands.
- Parcours libre et gratuit de tous les stands.
- Visionnage des vidéos de présentation des exportateurs.
- Bouton pour demander un rendez-vous avec un exportateur.

### 4.3 Prise de rendez-vous (RDV)

Processus :
- L’importateur sélectionne un exportateur et propose une date/heure.
- L’exportateur peut : confirmer, proposer un autre créneau ou refuser.
- Une fois confirmé, le RDV ouvre un canal d’échange dédié à la date convenue : messagerie texte et/ou échange vocal.
- Rappel automatique envoyé aux deux parties avant le RDV (email/notification).
- Le RDV n’est pas comptabilisé dans le quota de chats gratuits.

Statuts de RDV :
- PROPOSE
- CONFIRME
- REFUSE
- TERMINE

### 4.4 Dashboard Administrateur — Gestion des salons

Fonctionnalités d’administration :
- Création d’un salon : thème, catégorie, dates, prix du stand.
- Validation des inscriptions des exportateurs : profil, paiement, vidéo.
- Vue d’ensemble des stands et du statut de paiement.
- Statistiques du salon : nombre de visiteurs, nombre de RDV pris, taux de conversion.
- Publication et clôture du salon.

Statuts des salons :
- BROUILLON
- PUBLIE
- EN_COURS
- TERMINE

Statuts des stands :
- EN_ATTENTE_PAIEMENT
- EN_ATTENTE_VALIDATION
- VALIDE
- REJETE

### 4.5 Diffusion et visibilité du salon

Visibilité :
- Annonce du salon sur la plateforme (bannière, section "Salons en cours").
- Notification email aux importateurs inscrits dans la catégorie concernée.
- Lien de partage direct du salon.

## 5. Dépendances

Dépendances essentielles :
- Schéma de profil entreprise exportateur du backend (Stagiaire 2).
- Statut de validation du profil entreprise (Stagiaire 4) pour autoriser la réservation de stand.
- Intégration paiement existante (Stripe) ou mise en place d’un paiement simple dédié en V1.

## 6. Livrables attendus

Livrables pour ce module :
- Module salon fonctionnel de bout en bout.
- Page de création et gestion du salon pour l’administrateur.
- Réservation de stand pour l’exportateur.
- Consultation du salon et prise de RDV pour l’importateur.
- Pages : accueil salon, page de stand, flux RDV.
- Dashboard admin de gestion des salons.

## 7. Proposition d’architecture technique

### Backend

Entités principales :
- Salon
- Stand
- InscriptionStand
- RendezVous
- StatistiquesSalon

API principales :
- Création / mise à jour / publication de salon.
- Inscription stand + paiement.
- Téléversement vidéo et documents.
- Liste de stands pour importateur.
- Gestion des RDV.
- Tableau de bord administrateur.

### Frontend

Pages principales :
- Liste des salons disponibles.
- Page salon (fiche salon + liste des stands).
- Page stand exposant.
- Formulaire de réservation de stand.
- Interface RDV importateur / exportateur.
- Dashboard admin salons.

## 8. User stories proposées

### Exportateur

- En tant qu’exportateur, je veux réserver un stand dans un salon payant pour présenter mes produits.
- En tant qu’exportateur, je veux envoyer une vidéo de présentation et des documents d’entreprise.
- En tant qu’exportateur, je veux recevoir une notification dès que mon RDV est confirmé.

### Importateur

- En tant qu’importateur, je veux accéder gratuitement à un salon virtuel.
- En tant qu’importateur, je veux parcourir tous les stands et regarder les vidéos.
- En tant qu’importateur, je veux demander un RDV avec un exportateur.

### Administrateur

- En tant qu’administrateur, je veux créer et publier un salon thématique.
- En tant qu’administrateur, je veux valider les inscriptions des stands et suivre les paiements.
- En tant qu’administrateur, je veux consulter des statistiques de participation.

## 9. Plan de travail suggéré

1. Récupérer le schéma du profil entreprise et les statuts de validation.
2. Définir les modèles de données backend.
3. Implémenter l’API de création et publication de salon.
4. Implémenter l’inscription de stand et l’intégration paiement.
5. Construire l’interface salon / liste de stands.
6. Construire le flux de RDV et les notifications.
7. Déployer un prototype et tester le parcours complet.

---

> Ce document peut être partagé avec ton équipe comme cahier des charges fonctionnel et base de planification. Si tu veux, je peux aussi t’aider à transformer cela en un backlog Jira / Trello ou en maquette de composants UI.