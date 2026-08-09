# Indeed² — Import/Export Matching

Plateforme qui met en relation des exportateurs et des importateurs.

## Lancer le projet

```bash
npm install
npm run dev
```

L'app fonctionne toute seule, sans backend : les données (annonces, comptes, messages...) sont simulées dans le dossier `mocks/`. Pour brancher un vrai backend plus tard, il suffit de changer `USE_MOCKS` en `false` dans `src/api/client.js`.

## Les grandes parties du projet

### 🔐 Authentification

Fichiers : `context/AuthContext.jsx`, `pages/LoginPage.jsx`, `pages/RegisterPage.jsx`

- `AuthContext` garde en mémoire qui est connecté et gère la connexion/inscription/déconnexion.
- Après connexion, un token est enregistré (`utils/tokenStorage.js`) — soit de façon durable (case "se souvenir de moi" cochée), soit juste pour la session.
- `ProtectedRoute` bloque l'accès à certaines pages (profil, messagerie, mes annonces...) si personne n'est connecté, et renvoie vers `/auth/login`.

### 📦 Annonces (Listings)

Fichiers : `pages/ListingsPage.jsx`, `ListingDetailPage.jsx`, `ListingCreatePage.jsx`, `MyListingsPage.jsx`

- Publier, modifier, consulter et lister les annonces d'import/export.
- `MyListingsPage` regroupe uniquement les annonces du compte connecté.
- `ListingsShowcasePage` (`/listings`) est la vitrine publique, visible sans être connecté.

### 🤝 Matching

Fichier : `pages/MatchingPage.jsx`

- Propose des correspondances entre les annonces de l'utilisateur et celles des autres, avec un score de pertinence.
- Réservé aux utilisateurs connectés.

### 💬 Messagerie

Fichiers : `features/messaging/`

- Permet d'échanger des messages entre un exportateur et un importateur intéressés par une même annonce.
- `MessagingPage` = les vraies conversations (connecté uniquement). `MessagesPage` (route `/Vmessages`) = un aperçu visible par les visiteurs, pour donner envie de créer un compte.
- Chaque message envoyé consomme un crédit du plan de facturation — la messagerie est donc reliée au module Facturation (voir plus bas) : au-delà d'un certain nombre de messages en plan gratuit, l'envoi est bloqué tant qu'on n'a pas upgradé son plan.

### ⭐ Favoris

Fichiers : `pages/FavoritesPage.jsx`, `api/favorites.js`

- Permet de sauvegarder des annonces intéressantes pour les retrouver facilement.

### 👤 Profil

Fichiers : `pages/ProfilePage.jsx`, `ProfileCompletionPage.jsx`, `ProfileStatusPage.jsx`, `OnboardingListingPage.jsx`

- Après inscription, l'utilisateur complète son profil (entreprise, secteur, certifications...).
- Le profil passe ensuite par un statut : en attente → validé/refusé (`ProfileStatusPage`), avant de pouvoir publier des annonces.

### 💳 Facturation & paiement (Stripe)

Fichiers : `features/billing/`

- Trois plans (gratuit / payants), visibles sur `PlansPage`.
- `BillingPage` regroupe l'abonnement en cours, l'usage (messages envoyés) et les factures.
- Le paiement d'une carte se fait avec **Stripe** : le champ où l'on tape son numéro de carte est directement fourni par Stripe (pas par nous), donc le numéro de carte ne passe jamais par notre code — on ne récupère qu'un jeton une fois la carte validée.
- Pour tester un paiement, utiliser une carte de test Stripe : `4242 4242 4242 4242` (n'importe quelle date future, n'importe quel CVC à 3 chiffres) → paiement accepté. `4000 0000 0000 0002` → carte refusée exprès, pour tester ce cas.
- Comme tout tourne en mocks, aucun vrai débit n'a lieu : Stripe valide juste que la carte est correcte, puis le plan est activé localement.

## Performance

Le site a été audité avec Lighthouse et optimisé (score Performance : 55 → 94), principalement en ne chargeant chaque page (et notamment Stripe) qu'au moment où elle est vraiment visitée.
> Pour un audit Lighthouse fiable, toujours tester sur `npm run build` + `npm run preview` (port 4173), jamais sur `npm run dev` (port 5173).