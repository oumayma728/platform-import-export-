# Plateforme Import / Export Mondiale - Backend API

Ce dépôt contient le code source de l'infrastructure serveur (Backend) développée en **Python avec FastAPI**. Cette API sert de socle pour connecter les exportateurs et importateurs à l'échelle mondiale.

## 🚀 État d'avancement (Tâches 1, 2 et 3 Terminées)

Les fondations sécurisées, la gestion des profils et le système d'annonces sont 100% opérationnels. L'API est prête à être consommée par les autres membres de l'équipe.

### 1. Authentification & Profils (Débloque Stagiaire 4 & 5)
- **Modèles de données** : Utilisateur, Entreprise (Exportateur/Importateur), Rôles.
- **Sécurité** : Inscription et Connexion par Token (JWT - format JSON simplifié).
- **Statuts d'Entreprise** : `EN_ATTENTE_VALIDATION`, `VALIDE`, `REJETE`, `SUSPENDU`.
- **API Admin** : Endpoint spécifique pour permettre à l'Administrateur de valider ou rejeter les comptes en attente.

### 2. Annonces / Listings (Débloque Stagiaire 3 - AI Matching)
- **Modèle de données complet** : Annonces (Offre/Demande), catégorie, prix, quantité, localisation, Incoterms, documents, etc.
- **CRUD Sécurisé** : Seule une entreprise `VALIDE` peut publier une annonce. Seul le propriétaire de l'annonce peut modifier son contenu.
- **Moteur de Recherche** : Endpoint `GET /listings/search` avec des filtres dynamiques (pays, catégorie, prix, certification) et pagination. 
- **Modération Admin** : Pouvoir de suspension, de clôture et de suppression sur n'importe quelle annonce, sans droit de falsification du contenu.

---

## 🔗 Utilisation par les autres Stagiaires (Dépendances)

Toute la documentation technique interactive (Swagger) est générée automatiquement à l'adresse `/docs` une fois le serveur lancé.

### Pour le Stagiaire 3 (Agent IA de Matching)
- Vous pouvez dès à présent consommer la route `GET /api/v1/listings/search` pour récupérer la base d'annonces actives et entraîner ou exécuter votre IA de matching.
- Tous les modèles de données des listings sont documentés dans Swagger.

### Pour le Stagiaire 4 (Dashboard Admin)
- Connectez-vous avec un compte possédant le rôle `ADMIN`.
- Utilisez `PATCH /api/v1/admin/companies/{id}/status` pour modérer les inscriptions.
- Utilisez `PATCH /api/v1/admin/listings/status/{id}` pour modérer les annonces signalées.

#### 👑 Comment créer et tester un compte Administrateur (Local)
Pour des raisons de sécurité, on ne peut pas s'inscrire directement en tant qu'Admin. Voici la marche à suivre pour tester les routes d'administration :
1. Créez un compte classique via la route `POST /api/v1/auth/register` (ex: email `admin@example.com`).
2. Ouvrez un terminal dans le dossier `backend` et exécutez le script secret :
   ```bash
   python make_admin.py admin@example.com
   ```
3. Votre compte a maintenant le rôle `ADMIN` !
4. Allez sur `POST /api/v1/auth/login` (ou cliquez sur le cadenas "Authorize" en haut de Swagger) et connectez-vous avec votre email et mot de passe.
5. Swagger injectera automatiquement votre `Token d'accès` (JWT) dans l'en-tête de toutes vos requêtes, vous donnant le droit d'utiliser les routes `/admin`.

---

## 🛠️ Instructions d'installation en local

**1. Lancer la Base de Données (PostgreSQL)**
Assurez-vous d'avoir Docker installé, puis lancez :
```bash
cd backend
docker-compose up -d
```

**2. Lancer le Serveur FastAPI**
Dans votre environnement virtuel Python :
```bash
python -m uvicorn app.main:app --reload
```

L'API et la documentation Swagger seront accessibles sur : **http://127.0.0.1:8000/docs**
