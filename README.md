# Import Export Platform — version intégrée

Plateforme web import/export avec frontend React/Vite et backend FastAPI/PostgreSQL. Cette version regroupe les corrections d’intégration réalisées sur l’authentification, les annonces, les référentiels dynamiques, le matching, la messagerie, les notifications et la facturation.

## Fonctionnalités principales

### Authentification et profil

- Inscription et connexion réelles via FastAPI/PostgreSQL.
- JWT + refresh token.
- Profil entreprise synchronisé avec la base.
- Upload du logo entreprise.
- Changement du mot de passe pour un utilisateur connecté.
- Mot de passe oublié avec token temporaire et page de réinitialisation.
- Envoi des emails de réinitialisation via SMTP (Brevo recommandé).

### Annonces et référentiels

- Création, modification, consultation et filtrage des annonces.
- Référentiels stockés en base dans `reference_options` :
  - catégories ;
  - pays ;
  - devises ;
  - unités ;
  - Incoterms.
- Une valeur absente peut être ajoutée depuis le formulaire puis réutilisée après rechargement.
- Les filtres Catégorie/Pays et la section « Explorer par secteur » utilisent les référentiels backend au lieu de listes figées.

### Matching IA — règle métier par rôle

Le matching applique désormais le besoin métier automatiquement côté backend :

- **Exportateur** : ses offres sont comparées uniquement aux **demandes** d’autres utilisateurs.
- **Importateur** : ses demandes sont comparées uniquement aux **offres** d’autres utilisateurs.
- **Importateur & Exportateur** : chaque annonce est comparée au type opposé.

La sécurité de cette règle est côté backend (`GET /api/matching-results`) ; le frontend ne peut donc pas contourner le sens du matching par un simple filtre local.

### Messagerie

- Conversations réelles en base.
- Une conversation vide ne consomme aucun message gratuit.
- Plan gratuit : 50 messages envoyés, puis blocage avec message explicite de limite atteinte.
- Paiement à l’usage : logique distincte par conversation.
- Premium : messagerie illimitée.
- Messages lus/non lus persistés en base.
- Badge global `Messagerie (N)` lorsqu’il existe des messages non lus.
- Indicateur rouge dans la navigation lorsqu’il y a des non-lus.
- Compteur de non-lus par conversation.
- Filtres : **Tous / Non lus / Lus**.
- Ouvrir une conversation marque uniquement les messages reçus comme lus.

### Notifications

Routes raccordées :

- `GET /api/notifications/me`
- `PATCH /api/notifications/{notification_id}/read`
- `POST /api/notifications/email`
- `POST /api/notifications/sms`
- `POST /api/notifications/retry-failed`

La messagerie utilise les notifications IN_APP pour synchroniser l’état lu/non lu. Les notifications email et SMS restent dépendantes de la configuration des fournisseurs externes.

### Facturation

- Offre gratuite : 50 messages.
- Paiement à l’usage : 0,50 € par conversation selon la logique métier du module.
- Premium : abonnement Stripe.
- Stripe Elements / SetupIntent pour l’enregistrement sécurisé des cartes.
- Moyens de paiement, abonnement et factures via le backend Stripe.

## Stack technique

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT / Passlib / bcrypt
- Stripe
- SMTP Brevo
- Twilio (SMS, optionnel)
- APScheduler

### Frontend

- React
- Vite
- React Router
- Axios
- React Hook Form
- Stripe.js / React Stripe.js
- Lucide React / React Icons

## Arborescence simplifiée

```text
.
├── app/
│   ├── config/
│   ├── controllers/
│   ├── matching/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   └── services/
├── migrations/
├── tests/
├── Import_export_frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
├── main.py
├── requirements.txt
├── alembic.ini
└── .env.example
```

## Prérequis

- Python installé et accessible avec `python`.
- PostgreSQL installé et démarré.
- Node.js + npm.

Un environnement virtuel Python est recommandé, mais il n’est pas obligatoire. Aucun script `.bat` n’est nécessaire pour lancer le projet.

## Configuration backend

Créer `.env` à partir de `.env.example` :

```powershell
Copy-Item .env.example .env
```

Puis renseigner au minimum :

```env
DATABASE_URL=postgresql://postgres:mot_de_passe@localhost:5432/import_export_db
JWT_SECRET=une-cle-secrete-longue-et-aleatoire
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=votre-login-smtp-brevo
SMTP_PASSWORD=votre-cle-smtp-brevo
SMTP_FROM=votre-expediteur-verifie

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PREMIUM_PRICE_ID=
SUBSCRIPTION_PRICE=29

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Ne jamais versionner `.env`, les clés Stripe secrètes, les clés SMTP ou les tokens Twilio.

## Installation backend

Depuis la racine du projet :

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Optionnel — environnement virtuel :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## Lancement backend

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Au démarrage, le projet exécute son initialisation de base et les migrations prévues par `database_startup`.

Documentation Swagger :

```text
http://127.0.0.1:8000/docs
```

## Configuration frontend

Dans `Import_export_frontend`, créer `.env.local` à partir de `.env.example` :

```powershell
cd Import_export_frontend
Copy-Item .env.example .env.local
```

Configuration minimale :

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

La clé Stripe du frontend est la clé **publique** (`pk_...`), jamais la clé secrète (`sk_...`).

## Installation et lancement frontend

```powershell
cd Import_export_frontend
npm install
npm run dev
```

Vite affichera l’adresse locale à ouvrir dans le navigateur (généralement `http://localhost:5173`).

## Tests

Backend :

```powershell
pytest
```

Frontend :

```powershell
cd Import_export_frontend
npm test
```

Build frontend :

```powershell
npm run build
```

## Matching : exemples attendus

### Compte Exportateur

```text
Mes annonces utilisées pour le matching : OFFRES
Partenaires proposés : DEMANDES
```

### Compte Importateur

```text
Mes annonces utilisées pour le matching : DEMANDES
Partenaires proposés : OFFRES
```

### Double rôle

```text
Mes OFFRES  -> DEMANDES partenaires
Mes DEMANDES -> OFFRES partenaires
```

## Messagerie : comportement attendu

```text
Conversation créée / ouverte sans message -> quota inchangé
1er message envoyé -> 49 messages gratuits restants
2e message envoyé -> 48
...
50e message envoyé -> limite atteinte
```

Les messages reçus non lus alimentent le badge `Messagerie (N)`. L’ouverture de la conversation met à jour les messages et notifications correspondants en lecture.

## Sécurité

- Les mots de passe sont hashés avec bcrypt et ne sont pas récupérables en clair.
- Les erreurs de connexion ne doivent pas provoquer une redirection/réinitialisation du formulaire de login.
- Les numéros de carte/CVC ne sont pas stockés par l’application.
- Les secrets restent côté backend dans `.env`.
- Le mot de passe oublié renvoie une réponse générique afin de ne pas révéler si un compte existe.

## Notes fournisseurs externes

- **Brevo SMTP** : le compte SMTP doit être activé pour que l’envoi réel fonctionne.
- **Twilio** : nécessaire uniquement pour l’envoi SMS réel.
- **Stripe** : utiliser les clés de test pour le développement.



### Persistance du type de compte (Importateur / Exportateur)

La modification dans **Profil > Compte professionnel** est persistée via `PUT /api/auth/profile`.
Le backend synchronise `users.type_compte` et la colonne historique `users.role`. La sélection multi-rôle
(`EXPORTATEUR,IMPORTATEUR`) est donc conservée après actualisation et est utilisée par le Matching.

Si une ancienne base existe déjà, le démarrage applique automatiquement les migrations Alembic, notamment
l'élargissement de `users.type_compte` à 50 caractères.
