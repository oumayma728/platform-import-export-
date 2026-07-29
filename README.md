# platform-import-export-

# Import Export Platform API

Backend API développé avec FastAPI pour la gestion d'une plateforme d'échanges internationaux. Le service couvre l'authentification, la gestion des annonces, la messagerie temps réel, la facturation (Stripe), les notifications (email/SMS), et les intégrations métiers (devises, logistique).

## Présentation du projet

Cette application fournit une API sécurisée et évolutive pour les acteurs du domaine import/export. Elle permet de :

- gérer l'authentification et les autorisations des utilisateurs (JWT + refresh token) ;
- administrer des listings / annonces commerciales (CRUD + recherche) ;
- gérer les conversations et la messagerie interne, en temps réel (WebSocket) ;
- traiter les paiements à l'usage et les abonnements récurrents via Stripe, avec gestion des webhooks ;
- envoyer des notifications email (SendGrid) et SMS (Twilio), et les afficher sur un centre de notifications ;
- convertir des devises et estimer des coûts logistiques entre pays ;
- exposer une documentation API interactive et un schéma OpenAPI.

## Stack technique

- Python 3.10+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT (python-jose) + Passlib/bcrypt pour l'authentification
- Stripe pour les paiements et abonnements
- SendGrid pour les emails
- Twilio pour les SMS
- WebSocket (natif FastAPI) pour la messagerie temps réel
- Pytest pour les tests

## Prérequis

Avant de démarrer, assurez-vous d'avoir installé :

- Python 3.10 ou plus récent
- PostgreSQL
- pip
- virtualenv (recommandé)
- [Stripe CLI](https://docs.stripe.com/stripe-cli) (uniquement pour tester les webhooks Stripe en local)

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

4. Configurer les variables d'environnement :

   Copier le fichier .env.example vers .env puis renseigner les valeurs nécessaires.

   ```bash
   copy .env.example .env
   ```

   Variables principales :

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | Chaîne de connexion PostgreSQL |
   | `JWT_SECRET` | Clé secrète JWT (obligatoire, aucune valeur par défaut) |
   | `JWT_ALGORITHM` | Algorithme JWT (défaut : HS256) |
   | `JWT_EXPIRE_MINUTES` | Durée de validité du token d'accès |
   | `STRIPE_SECRET_KEY` | Clé secrète Stripe (mode test ou live) |
   | `STRIPE_WEBHOOK_SECRET` | Secret de signature du webhook Stripe |
   | `SUBSCRIPTION_PRICE` | Seuil de dépense (paiement à l'usage) déclenchant la recommandation d'abonnement |
   | `SENDGRID_API_KEY` | Clé API SendGrid (optionnelle — sans elle, les notifications email restent enregistrées en base sans envoi réel) |
   | `SENDGRID_FROM_EMAIL` | Adresse expéditrice vérifiée sur SendGrid |
   | `TWILIO_ACCOUNT_SID` | Identifiant de compte Twilio (optionnel, même logique que SendGrid) |
   | `TWILIO_AUTH_TOKEN` | Jeton d'authentification Twilio |
   | `TWILIO_PHONE_NUMBER` | Numéro Twilio utilisé comme expéditeur SMS |

## Exécution

Démarrer l'API localement :

```bash
uvicorn main:app --reload
```

L'API sera disponible à l'adresse suivante :

- http://127.0.0.1:8000
- Documentation Swagger : http://127.0.0.1:8000/docs
- Schéma OpenAPI : http://127.0.0.1:8000/openapi.json

### Tester les webhooks Stripe en local

Les événements Stripe ne peuvent pas atteindre directement `127.0.0.1`. En local, il faut faire tourner en parallèle :

```bash
stripe listen --forward-to http://127.0.0.1:8000/api/webhooks/stripe
```

Copier le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET` (il change à chaque relance de `stripe listen`), puis relancer `uvicorn`.

En production, cette étape n'est plus nécessaire : l'URL du webhook est enregistrée une seule fois dans le Dashboard Stripe (Developers → Webhooks).

## Base de données

Les migrations sont gérées avec Alembic.

Appliquer les migrations :

```bash
alembic upgrade head
```

Vérifier que la base est bien à jour :

```bash
alembic current
```
(doit afficher la révision la plus récente, marquée `(head)`)

## Tests

Exécuter les tests :

```bash
pytest
```

## Structure du projet

```text
app/
  controllers/     # logique métier (auth, conversations, listings)
  models/          # modèles SQLAlchemy
  routes/          # endpoints FastAPI, groupés par domaine
  schemas/         # schémas Pydantic (validation des entrées/sorties)
  services/        # intégrations externes (Stripe, SendGrid, Twilio, devises, logistique)
  middleware/      # authentification JWT
  data/            # données statiques embarquées (coordonnées pays)
  config/          # configuration base de données
main.py
migrations/
requirements.txt
```

## Fonctionnalités principales

- **Authentification** : inscription, connexion, JWT + refresh token (hashé en SHA-256), profils, validation admin des comptes
- **Listings / annonces** : CRUD complet, recherche avec filtres, suspension/clôture
- **Messagerie** : conversations avec cycle de statuts (SUGGEREE → CONSULTEE → EN_CONTACT → EN_NEGOCIATION → CONCLUE/REJETEE), envoi de messages et documents, WebSocket temps réel
- **Facturation** : compteur de 50 chats gratuits, blocage automatique au dépassement, paiement à l'usage et abonnement récurrent via Stripe, webhooks sécurisés (vérification de signature), recommandation automatique d'abonnement
- **Notifications** : email (SendGrid) et SMS (Twilio), centre de notifications consultable (`GET /notifications/me`), statut lu/non lu, déclenchement automatique sur les événements clés (nouveau message, paiement confirmé, limite atteinte)
- **Intégrations** : conversion de devises (taux réels), estimation logistique entre pays (distance, coût, délai — jeu de données local couvrant ~250 pays, sans dépendance réseau)
- **Documentation API** : Swagger UI (`/docs`), ReDoc (`/redoc`), schéma OpenAPI, collection Postman

## Limitations connues

- L'estimation logistique calcule une distance à vol d'oiseau entre centroïdes de pays — une approximation, pas un itinéraire réel de transport.
- L'envoi SMS via Twilio en compte d'essai (Trial) nécessite d'activer manuellement les permissions géographiques par pays dans la console Twilio, et de vérifier chaque numéro destinataire.

## Contribution

Les contributions sont les bienvenues. Veuillez proposer vos changements via une branche dédiée puis ouvrir une pull request.

## Licence

Ce projet est fourni à titre éducatif et de démonstration. La licence peut être adaptée selon les besoins de l'équipe ou du client.