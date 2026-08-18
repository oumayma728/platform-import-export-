# Plan de démarrage – Salons Virtuels

## Objectif
Donner une feuille de route claire pour commencer la réalisation du cahier des charges.

## 1. Valider les points clés avec l’équipe

- Confirmer les dépendances :
  - schéma du profil entreprise exportateur (Stagiaire 2),
  - validation du profil entreprise (Stagiaire 4),
  - solution de paiement Stripe existante.
- Vérifier l’architecture déjà en place : frontend, backend, base de données.
- Identifier les contraintes de temps et les livrables prioritaires.

## 2. Définir le MVP (Minimum Viable Product)

Fonctionnalités indispensables pour la première version :
- admin : création d’un salon et publication,
- exportateur : demande de stand + paiement,
- importateur : consultation du salon + prise de RDV,
- admin : validation des stands.

## 3. Découper en tâches

Commence par ces 5 tâches :
1. Modèle de données : salons, stands, RDV, statuts.
2. API backend : création de salon, inscription de stand, consultation des stands, gestion RDV.
3. Frontend admin : formulaire de création de salon, liste des stands, validation.
4. Frontend exportateur : inscription stand + upload média.
5. Frontend importateur : page de salon, page de stand, demande de RDV.

## 4. Définir les livrables de la première itération

- document de spécifications technique simplifié,
- maquette des écrans principaux (papier ou prototype simple),
- modèle de données et endpoints API basiques,
- preuves de concept pour le paiement et le upload de fichiers.

## 5. Prioriser et commencer par le backend

Pourquoi commencer par le backend :
- les données et les statuts sont le cœur du module,
- cela permet ensuite de brancher le frontend plus facilement.

Ordre recommandé :
1. Créer le modèle de salon, stand, RDV.
2. Implémenter les statuts métiers (`BROUILLON`, `PUBLIE`, `EN_COURS`, `TERMINE`, etc.).
3. Construire l’API de création de salon et inscription de stand.
4. Vérifier la logique de validation et le flux de paiement.
5. Créer une page de liste de stands et une page de salon simple.

## 6. Ce qu’il faut faire en premier aujourd’hui

- Relire le CDC et lister les dépendances exactes.
- Préparer un rapide schéma de données sur une page ou un tableau.
- Écrire le premier ticket : "Créer le modèle de données des salons et stands".
- Discuter immédiatement avec Stagiaire 2 et 4 pour obtenir les schémas du profil exportateur et des statuts.

---

> Astuce : fais un document de suivi simple (Excel, Trello, Notion) avec : tâche, responsable, statut, dépendance. Cela te permettra de guider ton travail et de montrer ton avancement à l’équipe.