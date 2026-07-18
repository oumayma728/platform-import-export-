# platform-import-export-

# Import Export Platform API

Backend API développé avec FastAPI pour la gestion d’une plateforme d’échanges internationaux. Le service couvre les fonctionnalités d’authentification, de gestion des annonces, de messagerie, de facturation et d’intégrations métiers.

## Présentation du projet

Cette application fournit une API sécurisée et évolutive pour les acteurs du domaine import/export. Elle permet de :

- gérer l’authentification et les autorisations des utilisateurs ;
- administrer des listings / annonces commerciales ;
- gérer les conversations et la messagerie interne ;
- traiter les paiements et abonnements via Stripe ;
- exposer une documentation API interactive et un schéma OpenAPI.

## Stack technique

- Python 3.10+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT pour l’authentification
- Stripe pour les paiements
- Pytest pour les tests

## Prérequis

Avant de démarrer, assurez-vous d’avoir installé :

- Python 3.10 ou plus récent
- PostgreSQL
- pip
- virtualenv (recommandé)

## Installation

1. Cloner le dépôt :

   ```bash
   git clone <url-du-repo>
   cd import_export_backend
   ```

2. Créer et activer un environnement virtuel :

   ```bash
   py -m venv venv
   venv\Scripts\activate
   ```

3. Installer les dépendances :

   ```bash
   pip install -r requirements.txt
   ```

4. Configurer les variables d’environnement :

   Copier le fichier .env.example vers .env puis renseigner les valeurs nécessaires.

   ```bash
   copy .env.example .env
   ```

   Variables principales :
   - DATABASE_URL
   - JWT_SECRET
   - JWT_ALGORITHM
   - JWT_EXPIRE_MINUTES
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET

## Exécution

Démarrer l’API localement :

```bash
uvicorn main:app --reload
```

L’API sera disponible à l’adresse suivante :

- http://127.0.0.1:8000
- Documentation Swagger : http://127.0.0.1:8000/docs
- Schéma OpenAPI : http://127.0.0.1:8000/openapi.json

## Base de données

Les migrations sont gérées avec Alembic.

Appliquer les migrations :

```bash
alembic upgrade head
```

## Tests

Exécuter les tests :

```bash
pytest
```

## Structure du projet

```text
app/
  controllers/
  models/
  routes/
  schemas/
  services/
  middleware/
main.py
migrations/
requirements.txt
```

## Fonctionnalités principales

- Authentification JWT
- Gestion des utilisateurs et rôles
- Listings / annonces
- Conversations et messagerie
- Intégrations de services externes
- Paiements et webhooks Stripe
- Documentation API interactive

## Contribution

Les contributions sont les bienvenues. Veuillez proposer vos changements via une branche dédiée puis ouvrir une pull request.

## Licence

Ce projet est fourni à titre éducatif et de démonstration. La licence peut être adaptée selon les besoins de l’équipe ou du client.
