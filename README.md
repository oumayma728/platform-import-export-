# 🌐 Module Salons Virtuels B2B — Stagiaire 5

Module indépendant permettant la création, la gestion et la participation à des **Salons Virtuels thématiques B2B** (ex: *"SIAM Virtuel"*, *"Salon Virtuel de l'Huile d'Olive"*), connectant les **Exportateurs** et les **Importateurs** à l'échelle mondiale.

Le module gère la réservation de stands payants par les exportateurs, l'accès gratuit et illimité pour les importateurs, la planification de rendez-vous d'affaires B2B, ainsi qu'un tableau de bord administrateur complet de modération et de suivi.

---

## 📋 Périmètre Fonctionnel (Conforme au Cahier des Charges)

### 🏬 4.1 Stand Exportateur (Stand Standard V1)
* **Paiement d'un frais fixe** : Inscription et réservation de stand payant via Stripe dans un salon actif.
* **Formulaire d'inscription** : Informations entreprise (ICE/RC), produits, certifications (ex: ISO 9001).
* **Uploads Médias & Documents** : Vidéo de présentation produit + documents complémentaires (fiches techniques, catalogues, certificats PDF).
* **Page de stand publique** : Page dédiée consultable par tous les importateurs inscrits au salon.
* **Gestion des RDV B2B** : Réception des demandes, confirmation, refus ou proposition de créneaux horaires alternatifs.

### 🛒 4.2 & 4.3 Accès Importateur & Prise de Rendez-vous (RDV)
* **Page d'accueil du salon** : Liste de tous les stands exposants avec parcours libre et gratuit.
* **Visionnage des vidéos & documents** : Consultation des vidéos de présentation et téléchargement des fiches techniques.
* **Demande de RDV** : Sélection d'un exportateur et proposition d'une date/heure de rendez-vous.
* **Accès au canal d'échange** : Une fois le RDV confirmé, un canal de messagerie texte dédié est ouvert.
* **Rappel automatique** : Notification/Email de rappel envoyé aux deux parties 24h avant le RDV.
* **Gratuité totale** : Le RDV et l'accès au salon ne sont jamais décomptés du quota de chats gratuits.
* **Statuts du RDV** : `PROPOSE` ➔ `CONFIRME` ➔ `REFUSE` ➔ `TERMINE`.

### 🛡️ 4.4 Dashboard Administrateur — Gestion des Salons
* **Création d'un salon** : Configuration du thème, de la catégorie, des dates de début/fin et du prix du stand.
* **Validation des inscriptions** : Modération et vérification du profil entreprise (ICE/RC), du paiement et de la vidéo soumise.
* **Suivi des statistiques** : Nombre de visiteurs du salon, nombre de RDV pris, taux de conversion %.
* **Gestion du cycle de vie du salon** :
  * **Statuts du Salon** : `BROUILLON` ➔ `PUBLIE` ➔ `EN_COURS` ➔ `TERMINE`.
  * **Statuts du Stand** : `EN_ATTENTE_PAIEMENT` ➔ `EN_ATTENTE_VALIDATION` ➔ `VALIDE` ➔ `REJETE`.

### 📢 4.5 Diffusion, Visibilité & Dépendances
* **Visibilité globale** : Section "Salons en cours" sur l'ensemble de la plateforme et Marketplace B2B.
* **Notifications par email** : Envoi automatique d'emails d'invitation aux importateurs inscrits dans la catégorie.
* **Lien de partage direct** : Accès direct via URL aux salons et aux stands exposants.
* **Dépendances & Paiement** : Intégration du profil entreprise validé (`Company.profile_status == 'VALIDE'`) et du système de paiement Stripe Checkout.

---

## 🛠️ Stack Technique

* **Backend** : FastAPI (Python) & PostgreSQL
* **Frontend** : React

---

## 📦 Livrables Attendu & Démarrage

### 1. Démarrage du Backend (FastAPI)
```bash
# Installation des dépendances et lancement
pip install -r backend/requirements.txt
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
> API & Documentation Swagger accessibles sur `http://localhost:8000/docs`.

### 2. Démarrage du Frontend (React)
```bash
# Installation et lancement du serveur Web
cd frontend
npm install
npm run dev
```
> Application Web accessible sur `http://localhost:5174`.

### 3. Validation des Tests Automatisés (Pytest)
```bash
cd backend
pytest
```

