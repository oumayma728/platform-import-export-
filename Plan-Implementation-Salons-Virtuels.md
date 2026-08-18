# Plan d’implémentation – Salons Virtuels

## 1. Définir le périmètre du module

### Fonctionnalités incluses dans la V1
- Création et gestion de salons virtuels par l’administrateur
- Réservation d’un stand par un exportateur
- Consultation des salons et des stands par les importateurs
- Prise de rendez-vous entre importateur et exportateur
- Validation des inscriptions par l’administrateur

### Hors périmètre de la V1
- stands premium
- options avancées de mise en avant
- échanges vocaux avancés
- notifications complexes

## 2. User stories

### Administrateur
- En tant qu’administrateur, je veux créer un salon pour le publier ensuite.
- En tant qu’administrateur, je veux valider les stands réservés.
- En tant qu’administrateur, je veux suivre les statistiques du salon.

### Exportateur
- En tant qu’exportateur, je veux réserver un stand dans un salon.
- En tant qu’exportateur, je veux téléverser une vidéo et des documents.
- En tant qu’exportateur, je veux confirmer ou refuser un rendez-vous.

### Importateur
- En tant qu’importateur, je veux consulter les salons et les stands.
- En tant qu’importateur, je veux demander un rendez-vous avec un exportateur.

## 3. Backlog initial

### Epic 1 – Gestion des salons
- Créer un salon
- Publier / clôturer un salon
- Voir les statistiques du salon

### Epic 2 – Gestion des stands
- Réserver un stand
- Payer la réservation
- Téléverser une vidéo et des documents
- Valider ou rejeter un stand

### Epic 3 – Consultation et RDV
- Voir la page d’accueil du salon
- Voir les stands validés
- Demander un rendez-vous
- Confirmer / refuser / terminer un rendez-vous

## 4. Schéma de base des données

### Table : salons
- id
- title
- category
- description
- start_date
- end_date
- stand_price
- status
- created_at
- updated_at

### Table : stands
- id
- salon_id
- exporter_id
- company_name
- products
- certifications
- video_url
- documents
- payment_status
- status
- created_at
- updated_at

### Table : rendez_vous
- id
- salon_id
- exporter_id
- importer_id
- proposed_datetime
- status
- created_at
- updated_at

### Table : users
- id
- name
- email
- role
- company_id
- profile_status

## 5. Statuts

### Statuts du salon
- BROUILLON
- PUBLIE
- EN_COURS
- TERMINE

### Statuts du stand
- EN_ATTENTE_PAIEMENT
- EN_ATTENTE_VALIDATION
- VALIDE
- REJETE

### Statuts du rendez-vous
- PROPOSE
- CONFIRME
- REFUSE
- TERMINE

## 6. Maquette simple des écrans

### Écrans à prévoir
- Page d’accueil des salons
- Page détail d’un salon
- Page détail d’un stand
- Formulaire de réservation de stand
- Tableau de bord administrateur
- Formulaire de demande de rendez-vous

## 7. Structure d’architecture frontend / backend

### Backend
- API salons
- API stands
- API rendez-vous
- Service de paiement
- Service d’upload de fichiers
- Service de notifications

### Frontend
- Pages publiques : salons, stands, détail stand
- Pages exportateur : réservation de stand, gestion RDV
- Pages importateur : consultation, demande RDV
- Dashboard admin : gestion des salons et stands

## 8. Premières API attendues

### Salon
- GET /salons
- GET /salons/:id
- POST /salons
- PUT /salons/:id
- PATCH /salons/:id/status

### Stand
- GET /salons/:id/stands
- POST /salons/:id/stands
- PATCH /stands/:id/validate
- PATCH /stands/:id/reject

### Rendez-vous
- GET /rendez-vous
- POST /rendez-vous
- PATCH /rendez-vous/:id/confirm
- PATCH /rendez-vous/:id/refuse
- PATCH /rendez-vous/:id/complete

## 9. Planification des sprints

### Sprint 1 – Fondation
- définir les entités et statuts
- créer les APIs de base salons et stands
- préparer la base du frontend

### Sprint 2 – Parcours exportateur
- formulaire de réservation de stand
- paiement simple ou intégration Stripe
- upload vidéo / documents

### Sprint 3 – Parcours importateur
- page salon et page stand
- demande de rendez-vous
- gestion des statuts RDV

### Sprint 4 – Administration et finalisation
- dashboard admin
- validation des stands
- statistiques de salon
- corrections et tests

---

Ce document peut servir de base de travail pour la première version du module.