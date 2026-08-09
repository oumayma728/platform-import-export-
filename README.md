# Indeed² — Import/Export Matching Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2.7-blue.svg)
![Vite](https://img.shields.io/badge/Vite-8.1.5-purple.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

**Une plateforme moderne qui met en relation des exportateurs et des importateurs à travers le monde**

[Démo Live](#) • [Documentation](#documentation) • [Support](#support)

</div>

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Architecture](#-architecture)
- [Technologies](#-technologies)
- [Documentation](#-documentation)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)

---

## 🎯 À propos

Indeed² est une plateforme B2B moderne qui facilite les échanges commerciaux internationaux en connectant exportateurs et importateurs. L'application offre un système de matching intelligent basé sur l'IA, une messagerie intégrée, et un système de facturation complet.

### Caractéristiques principales
- 🚀 **Interface responsive** - Optimisée pour desktop, tablette et mobile
- 🤖 **Matching IA** - Algorithme intelligent pour suggérer des partenaires commerciaux
- 💬 **Messagerie temps réel** - Communication directe entre utilisateurs
- 💳 **Facturation Stripe** - Gestion des abonnements et paiements sécurisés
- 🔐 **Authentification sécurisée** - Système complet de gestion des utilisateurs
- 📊 **Tableau de bord** - Analytics et suivi des performances

---

## ⚡ Installation

### Prérequis

- **Node.js** 18+ 
- **npm** 9+ 
- **Git**

### Installation rapide

```bash
# Cloner le repository
git clone https://github.com/Ayoub-glitsh/platform-import-export-.git
cd platform-import-export-/Import_export_frontend

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement (port 5173) |
| `npm run build` | Génère la version de production |
| `npm run preview` | Prévisualise la version de production (port 4173) |
| `npm run lint` | Vérifie le code avec Oxlint |
| `npm run test` | Lance les tests avec Vitest |

---

## 🏗️ Architecture

### Structure du projet

```
Import_export_frontend/
├── src/
│   ├── api/                    # Services API et configuration
│   │   ├── client.js          # Configuration Axios
│   │   ├── auth.js            # API authentification
│   │   ├── listings.js        # API annonces
│   │   └── ...
│   ├── components/            # Composants réutilisables
│   │   ├── atoms/             # Composants de base (Button, Input, etc.)
│   │   ├── molecules/         # Composants composés (Card, Form, etc.)
│   │   ├── organisms/         # Composants complexes (NavBar, Footer, etc.)
│   │   └── templates/         # Layouts de page
│   ├── context/              # Contextes React
│   │   └── AuthContext.jsx   # Gestion état utilisateur
│   ├── features/             # Modules fonctionnels
│   │   ├── billing/          # Système de facturation
│   │   └── messaging/        # Système de messagerie
│   ├── hooks/                # Hooks personnalisés
│   ├── mocks/                # Données simulées (développement)
│   ├── pages/                # Pages de l'application
│   ├── utils/                # Utilitaires et helpers
│   └── styles/               # Tokens et styles globaux
├── public/                   # Assets statiques
└── package.json
```

### Système de mocks

L'application fonctionne **entièrement en mode mock** pour le développement, sans nécessiter de backend. Les données sont simulées dans `src/mocks/`.

Pour basculer vers un vrai backend :
```javascript
// src/api/client.js
const USE_MOCKS = false; // Changer en false
```

---

## 🛠️ Technologies

### Core Stack
- **[React 19.2.7](https://react.dev/)** - Framework UI
- **[Vite 8.1.5](https://vitejs.dev/)** - Build tool et dev server
- **[React Router 7.18.1](https://reactrouter.com/)** - Routing
- **[Axios 1.18.1](https://axios-http.com/)** - Client HTTP

### UI & Styling
- **CSS-in-JS** - Styles inline avec design tokens
- **[Lucide React 1.23.0](https://lucide.dev/)** - Icônes modernes
- **[React Icons 5.7.0](https://react-icons.github.io/)** - Icônes supplémentaires
- **Design responsive** - Mobile-first approach

### Forms & Validation
- **[React Hook Form 7.81.0](https://react-hook-form.com/)** - Gestion des formulaires

### Paiements
- **[Stripe 5.5.0](https://stripe.com/)** - Processeur de paiement
- **[Stripe React 3.1.1](https://stripe.com/docs/stripe-js/react)** - Composants React

### Testing
- **[Vitest 4.1.10](https://vitest.dev/)** - Framework de test
- **[Testing Library 16.3.2](https://testing-library.com/)** - Utilitaires de test
- **[jsdom 29.1.1](https://github.com/jsdom/jsdom)** - Environnement DOM

### Development Tools
- **[Oxlint 1.71.0](https://oxc-project.github.io/)** - Linter ultra-rapide
- **[TypeScript types](https://www.typescriptlang.org/)** - Support TypeScript

---

## 📚 Documentation

### Les modules principaux

#### 🔐 Authentification
> **Fichiers** : `context/AuthContext.jsx`, `pages/LoginPage.jsx`, `pages/RegisterPage.jsx`

**Fonctionnalités** :
- Gestion d'état utilisateur avec React Context
- Token persistant (localStorage ou sessionStorage)  
- Protection des routes avec `ProtectedRoute`
- Formulaires de connexion/inscription avec validation

**Flux utilisateur** :
1. Inscription → Validation email → Complétion profil
2. Connexion → Dashboard utilisateur
3. Token stocké selon préférence "Se souvenir de moi"

#### 📦 Gestion des annonces (Listings)
> **Fichiers** : `pages/ListingsPage.jsx`, `ListingDetailPage.jsx`, `ListingCreatePage.jsx`

**Fonctionnalités** :
- **Vitrine publique** (`/listings`) - Visible sans connexion
- **Catalogue privé** (`/listings/catalog`) - Pour utilisateurs connectés
- **Mes annonces** (`/listings/mine`) - Gestion personnelle
- **Création/édition** avec formulaires dynamiques
- **Filtrage et recherche** avancés

**Types d'annonces** :
- Import (recherche de produits)
- Export (offre de produits)
- Informations détaillées (prix, quantité, certifications...)

#### 🤝 Matching intelligent
> **Fichier** : `pages/MatchingPage.jsx`

**Fonctionnalités** :
- Algorithme de correspondance basé sur :
  - Catégories de produits
  - Localisation géographique  
  - Certifications requises
  - Volumes de transaction
- Score de pertinence affiché
- Suggestions personnalisées

#### 💬 Système de messagerie
> **Fichiers** : `features/messaging/`

**Architecture** :
- **Interface desktop** - Deux volets (liste + conversation)
- **Interface mobile** - Vue adaptative (comme WhatsApp)
- **Aperçu public** (`/Vmessages`) pour visiteurs
- **Messagerie privée** (`/messages`) pour utilisateurs

**Limitations** :
- Consommation de crédits par message envoyé
- Blocage automatique si quota dépassé
- Integration avec système de facturation

#### ⭐ Favoris et sauvegarde
> **Fichiers** : `pages/FavoritesPage.jsx`, `api/favorites.js`

- Sauvegarde d'annonces intéressantes
- Accès rapide aux opportunités suivies
- Organisation et gestion des favoris

#### 👤 Gestion de profil
> **Fichiers** : `pages/ProfilePage.jsx`, `ProfileCompletionPage.jsx`, `ProfileStatusPage.jsx`

**Processus d'onboarding** :
1. **Inscription** - Informations de base
2. **Complétion profil** - Détails entreprise, secteurs, certifications
3. **Validation** - Statut en attente → approuvé/refusé
4. **Activation** - Accès complet aux fonctionnalités

#### 💳 Facturation et abonnements
> **Fichiers** : `features/billing/`

**Plans disponibles** :
- **Gratuit** - Fonctionnalités limitées
- **Pro** - Accès étendu  
- **Enterprise** - Fonctionnalités complètes

**Intégration Stripe** :
- Paiements sécurisés (PCI DSS compliant)
- Gestion des abonnements récurrents
- Historique et factures
- Cartes de test disponibles pour développement

**Cartes de test Stripe** :
```
✅ Paiement accepté  : 4242 4242 4242 4242
❌ Paiement refusé   : 4000 0000 0000 0002
```

---

## ⚡ Performance & Optimisations

### Lighthouse Score : **94/100** 🚀

**Optimisations implémentées** :
- **Code splitting** - Lazy loading des pages
- **Optimisation images** - Compression et formats modernes  
- **Bundle optimization** - Tree shaking et minification
- **Stripe lazy loading** - Chargement uniquement si nécessaire

> ⚠️ **Important** : Pour des résultats Lighthouse fiables, toujours tester sur la version de production :
> ```bash
> npm run build && npm run preview  # Port 4173
> ```

### Responsive Design

**Breakpoints** :
- 📱 **Mobile** : < 640px
- 📱 **Tablette** : 640px - 900px  
- 💻 **Desktop** : > 900px

**Fonctionnalités responsive** :
- Navigation adaptative avec menu burger
- Grilles flexibles (2-col → 1-col sur mobile)
- Messagerie avec vue mobile dédiée
- Optimisation tactile pour écrans mobiles

---

## 🧪 Tests

### Framework de test : Vitest + Testing Library

```bash
# Lancer les tests
npm run test

# Tests en mode watch
npm run test -- --watch

# Coverage des tests
npm run test -- --coverage
```

**Types de tests** :
- Tests unitaires des composants
- Tests d'intégration des features  
- Tests des hooks personnalisés
- Tests des utilitaires

---

## 🚀 Déploiement

### Build de production

```bash
# Génération des fichiers optimisés
npm run build

# Test local de la version de production
npm run preview
```

### Variables d'environnement

Créer un fichier `.env.local` :

```env
# API Configuration
VITE_API_BASE_URL=https://api.indeed2.com
VITE_USE_MOCKS=false

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Analytics (optionnel)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Déploiement recommandé

- **Vercel** - Configuration automatique Vite
- **Netlify** - Support natif des SPAs React
- **AWS S3 + CloudFront** - Pour la scalabilité

---

## 🤝 Contribution

### Standards de code

- **ESLint** - Configuration avec Oxlint
- **Prettier** - Formatage automatique
- **Conventional Commits** - Messages de commit standardisés
- **Component patterns** - Architecture Atomic Design

### Workflow Git

```bash
# Créer une branche feature
git checkout -b feature/nom-feature

# Développement avec commits atomiques
git commit -m "feat: ajouter composant FilterBar"

# Push et Pull Request
git push origin feature/nom-feature
```

---

## 📞 Support

- **Documentation** : [Wiki du projet](#)
- **Issues** : [GitHub Issues](https://github.com/Ayoub-glitsh/platform-import-export-/issues)
- **Email** : support@indeed2.com

---

## 📄 License

Ce projet est sous licence privée. Tous droits réservés.

---

<div align="center">

**Développé avec ❤️ par l'équipe Indeed²**

[⬆️ Retour en haut](#indeed²--importexport-matching-platform)

</div>