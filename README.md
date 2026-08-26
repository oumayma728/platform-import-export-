 Prérequis
* Node.js (v18+)
* PostgreSQL (v14+)
* Gestionnaire de paquets `npm` 
### 1. Configuration du Backend
```bash
cd Backend
# Installation des dépendances
npm install
# Configuration de l'environnement (.env)
# DATABASE_URL="postgresql://user:password@localhost:5432/import_export_db?schema=public"
# JWT_SECRET="your-super-secret-key"
# Synchronisation du schéma Prisma
npx prisma generate
npx prisma migrate dev
# Lancement du serveur en mode développement
npm run start:dev
```
*Le serveur Backend démarre sur `http://localhost:3000` (Documentation Swagger accessible sur `/api`).*
### 2. Configuration du Frontend
```bash
cd ../Frontend
# Installation des dépendances
npm install
# Lancement de l'application React
npm run dev
```
*L'application Frontend démarre sur `http://localhost:5173/admin/login`.*
---
## 👥 Auteur & Contribution
* **Module** : Trust & Safety, Modération & Dashboard Administrateur
* **Projet** : Plateforme Mondiale B2B Import / Export
* **Rôle** : Stagiaire 4
