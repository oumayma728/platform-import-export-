# Schéma de base – Salons Virtuels

## 1. Entité : Salon

Un salon représente un événement virtuel thématique.

### Champs principaux
- id
- title : titre du salon
- category : catégorie / thème
- description
- start_date
- end_date
- stand_price
- status : BROUILLON, PUBLIE, EN_COURS, TERMINE
- created_at
- updated_at

## 2. Entité : Stand

Un stand est réservé par un exportateur pour participer au salon.

### Champs principaux
- id
- salon_id
- exporter_id
- company_name
- products
- certifications
- video_url
- documents[]
- payment_status : EN_ATTENTE_PAIEMENT, EN_ATTENTE_VALIDATION, VALIDE, REJETE
- status
- created_at
- updated_at

## 3. Entité : RendezVous

Un rendez-vous est créé entre un importateur et un exportateur.

### Champs principaux
- id
- salon_id
- exporter_id
- importer_id
- proposed_datetime
- status : PROPOSE, CONFIRME, REFUSE, TERMINE
- message
- created_at
- updated_at

## 4. Entité : Utilisateur / Profil

Cette entité peut être utilisée pour représenter les profils des personnes qui participent au salon.

### Champs principaux
- id
- full_name
- role : EXPORTATEUR, IMPORTATEUR, ADMIN
- company_id
- profile_status
- email
- created_at

## 5. Relations entre entités

- Un salon contient plusieurs stands.
- Un stand appartient à un salon et à un exportateur.
- Un rendez-vous appartient à un salon, un exportateur et un importateur.

## 6. Version MVP simplifiée

Pour la première version, on peut garder seulement :
- Salon
- Stand
- RendezVous
- Utilisateur
