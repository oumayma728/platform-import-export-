# 🌍 Indeed² — La Plateforme d'Import/Export (Documentation Technique Détaillée)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB)
![Couverture de Tests](https://img.shields.io/badge/Couverture-91%25-brightgreen)

Bienvenue dans la documentation officielle d'**Indeed²**. Ce document s'adresse à tout développeur, ingénieur ou architecte rejoignant le projet. Il explique en profondeur chaque décision architecturale, la logique métier de chaque module, et la façon de faire tourner le projet.

---

## 🏗️ 1. Vue d'Ensemble de l'Architecture

Notre application repose sur une architecture découplée (Séparation du Frontend et du Backend) qui garantit sécurité et évolutivité.

```mermaid
graph TD
    Client[Frontend React]
    API[Backend FastAPI]
    DB[(PostgreSQL)]
    Redis[(Redis Cache / PubSub)]
    
    subgraph Services Externes
        Stripe[Stripe API - Facturation]
        Twilio[Twilio - SMS]
        SendGrid[SendGrid - Emails]
        ORS[OpenRouteService - Fret Logistique]
    end

    Client -- HTTPS (REST) --> API
    Client -- WSS (WebSockets Temps Réel) --> API
    API -- SQLAlchemy ORM --> DB
    API -- Caching --> Redis
    
    API -- Génération de Liens & Webhooks --> Stripe
    API -- SMS Transactionnels --> Twilio
    API -- Mails de bienvenue & Alertes --> SendGrid
    API -- Calcul de distances géographiques --> ORS
```

---

## 📂 2. Structure du Backend (Dossier par Dossier)

Le backend (`/backend`) est développé en **Python 3.10+** avec **FastAPI**. Il suit les principes du "Clean Architecture".

- **`app/models/`** : C'est ici que vit la structure de la base de données. Nous utilisons `SQLAlchemy`. Vous y trouverez la table `User`, `Company`, `Listing`, `Message`, `Billing` et `NotificationLog`.
- **`app/schemas/`** : Contient tous les modèles `Pydantic`. Ces modèles valident rigoureusement chaque donnée qui entre (ex: `UserCreate`) ou sort de l'API (ex: `ListingResponse`).
- **`app/routes/`** : Ce sont les contrôleurs de l'API. Chaque fichier gère un domaine précis (auth, admin, listings, messaging, billing, logistics).
- **`app/services/`** : La logique métier pure. Par exemple, le fichier `notification_service.py` contient la logique de repli (fallback) si Twilio est en panne.
- **`app/config/`** : Gère la sécurité (hachage bcrypt, JWT) et le chargement des variables d'environnement (`.env`).
- **`tests/`** : Plus de 30 tests automatisés avec `pytest`.

---

## 🧠 3. Analyse Détaillée des Modules Métier (De A à Z)

### 🔐 A. Sécurité, Rôles et Modération (Auth & Admin)
L'inscription se fait via l'endpoint `POST /auth/register`. Une fois inscrit, l'utilisateur reçoit un token JWT (JSON Web Token).
- **Les Rôles** : Un compte peut être `CLIENT` ou `ADMIN`.
- **Le Profil Entreprise** : Chaque `CLIENT` doit créer son profil (`Company`). Ce profil possède un `statut_validation`.
- **Modération Admin** : Par défaut, une entreprise est `EN_ATTENTE_VALIDATION`. Un administrateur doit appeler la route `PATCH /admin/companies/{id}/status` pour la valider (`VALIDE`). *Une entreprise non valide ne peut pas publier d'annonces.*

### 📦 B. Le Marché Mondial (Listings)
Les entreprises créent des annonces via `POST /listings/`.
- **Offre ou Demande** : Le système gère les vendeurs (`OFFRE`) et les acheteurs (`DEMANDE`).
- **Détails Techniques** : Les annonces incluent la quantité, le prix unitaire, le pays d'origine, et les règles d'expédition (ex: Incoterms FOB/CIF).
- **Moteur de Recherche** : L'endpoint `GET /listings/search` est puissant. Il permet de filtrer la base entière selon la catégorie, la fourchette de budget, et la localisation géographique.

### 💬 C. Messagerie Temps Réel (WebSockets)
Pour négocier, les clients utilisent notre système de WebSockets (`/ws/chat/{client_id}`).
- **Temps réel** : Grâce à Redis et aux WebSockets, les messages s'affichent instantanément sans recharger la page.
- **Historique** : Chaque message est sauvegardé dans la table `Message` de PostgreSQL. La `Conversation` passe par des statuts métier : `EN_CONTACT` ➡️ `CONCLUE` ou `ANNULEE`.

### 💳 D. Modèle Freemium & Facturation (Stripe)
Nous utilisons un modèle freemium intelligent géré dans `app/routes/billing.py`.
- **UserQuota** : À l'inscription, chaque entreprise reçoit 50 "chats gratuits". Entamer une nouvelle conversation coûte 1 crédit.
- **Stripe Checkout** : Si le quota est épuisé, l'API génère un lien de paiement officiel via Stripe (`POST /billing/create-payment-intent`).
- **Webhooks Automatiques** : Quand le client paie sur Stripe, Stripe envoie une requête secrète à notre route `POST /billing/webhook`. Notre serveur vérifie la signature cryptographique de Stripe, puis crédite le compte du client automatiquement.

### 🚢 E. Calcul Logistique & Fret (OpenRouteService)
L'import/export nécessite de connaître les coûts de transport.
- L'API fait appel à `OpenRouteService` (ORS) pour calculer la distance réelle (en kilomètres) entre le pays de l'exportateur et celui de l'importateur.
- En fonction de cette distance, de la quantité de marchandises, et du mode de transport choisi (Maritime ou Terrestre), une estimation tarifaire est renvoyée en temps réel.

### 🔔 F. Notifications Intelligentes (Twilio & SendGrid)
La plateforme alerte les utilisateurs (nouvelle conversation, inscription) par SMS et Email.
- **Service Résilient** : Le backend est conçu pour ne *jamais* planter. S'il n'y a pas de clés API Twilio/Sendgrid configurées, le système bascule en "Mode Simulation". Il simule l'envoi et trace l'opération avec un statut dans la table `NotificationLog`.

---

## 🗄️ 4. Schéma Conceptuel de la Base de Données

```mermaid
erDiagram
    USER ||--o{ COMPANY : "Possède (1:1)"
    COMPANY ||--o{ LISTING : "Publie (1:N)"
    COMPANY ||--|| BILLING : "Profil Paiement (1:1)"
    COMPANY ||--|| USER_QUOTA : "Crédits (1:1)"
    LISTING ||--o{ CONVERSATION : "Génère (1:N)"
    CONVERSATION ||--o{ MESSAGE : "Contient (1:N)"
    USER ||--o{ NOTIFICATION_LOG : "Reçoit (1:N)"

    USER {
        uuid id PK
        string email
        string role "ADMIN / CLIENT"
        string password_hash
    }
    
    COMPANY {
        uuid id PK
        uuid user_id FK
        string company_name
        string type "IMPORTATEUR / EXPORTATEUR"
        string statut_validation "VALIDE / REJETE"
    }
    
    LISTING {
        uuid id PK
        string titre
        string type "OFFRE / DEMANDE"
        float prix
        int quantite
    }
    
    CONVERSATION {
        uuid id PK
        string statut "EN_CONTACT / CONCLUE"
    }
    
    USER_QUOTA {
        int chats_gratuits_restants
    }
```

---

## ⚙️ 5. Configuration de l'Environnement (Fichier `.env`)

Le fichier `.env` est crucial. Placez-le dans le dossier `/backend/`.

| Clé | Utilité Principale | Où l'obtenir ? | Comportement si manquante |
|---|---|---|---|
| `DATABASE_URL` | Connecte l'API à PostgreSQL | URL locale (`postgresql://...`) | **Erreur Fatale** au lancement |
| `REDIS_URL` | Autorise les WebSockets temps-réel | URL locale (`redis://...`) | Les WebSockets échoueront |
| `STRIPE_SECRET_KEY` | Génère les liens de paiement | Stripe Dashboard > API keys | Impossible d'acheter des quotas |
| `STRIPE_WEBHOOK_SECRET` | Valide cryptographiquement les paiements | Stripe Dashboard > Webhooks | Le compte ne sera pas rechargé après achat |
| `ORS_API_KEY` | Calcule les distances géographiques réelles | Site OpenRouteService | Le calcul utilisera une formule basique (Haversine) |
| `SENDGRID_API_KEY` | Envoie de vrais e-mails aux clients | Site SendGrid | Activation du **Mode Simulation Email** |
| `TWILIO_ACCOUNT_SID` | Envoie de vrais SMS | Console Twilio | Activation du **Mode Simulation SMS** |
| `TWILIO_AUTH_TOKEN` | Sécurité de l'API SMS Twilio | Console Twilio | Activation du **Mode Simulation SMS** |
| `TWILIO_FROM_NUMBER` | Numéro d'expéditeur des SMS | Console Twilio | Activation du **Mode Simulation SMS** |

### Exemple de fichier `.env` prêt à l'emploi :
Copiez-collez ce bloc dans votre fichier `backend/.env` et remplacez les valeurs par vos vraies clés :

```env
# 1. Base de Données & Cache
DATABASE_URL="postgresql://user:password@localhost:5432/indeed2_db"
REDIS_URL="redis://localhost:6379/0"

# 2. Facturation (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# 3. Logistique (OpenRouteService)
ORS_API_KEY="5b3ce3597851110001cf6248..."

# 4. Emails (SendGrid)
SENDGRID_API_KEY="SG.xxx..."

# 5. SMS (Twilio)
TWILIO_ACCOUNT_SID="ACxxx..."
TWILIO_AUTH_TOKEN="xxx..."
TWILIO_FROM_NUMBER="+1234567890"
```

---

## 🚀 6. Déploiement & Tests (Guide Pratique)

### A. Lancer l'Infrastructure
Pour que le projet fonctionne, PostgreSQL et Redis doivent tourner. Utilisez Docker :
```bash
cd backend
docker-compose up -d
```

### B. Lancer le Backend Python
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### C. Tester l'API visuellement (Sans React)
Nous avons créé un environnement de test sur mesure !
1. Ouvrez le fichier `frontend_tests/dashboard_test.html` dans Google Chrome.
2. Cette interface HTML/JS pure se connecte à votre backend local. Elle permet de s'inscrire, créer des annonces, envoyer des messages WebSockets et lire les logs de notification.

### D. La Documentation Interactive Swagger
FastAPI génère une documentation OpenAPI 3.0 magnifique. Une fois le backend lancé, allez sur :
👉 **`http://127.0.0.1:8000/docs`**

### E. Générer des Données (Seeding)
Pour tester avec un volume massif de données (30 entreprises, 40 annonces, 90 messages échangés) :
```bash
cd backend
python seed_db.py
```
*Le compte Administrateur par défaut généré est `hatim1@gmail.com` avec le mot de passe `admin123`.*

---
*Ce projet a été testé avec une couverture de code de 91% garantissant sa robustesse en milieu de production. Fin de la documentation.*
