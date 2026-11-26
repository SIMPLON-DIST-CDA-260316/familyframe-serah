# FamilyFrame — Instructions pour les agents IA

## Contexte

Projet pédagogique CDA. Développer un POC de cadre photo connecté en 7 heures.

L'objectif principal de la semaine est Docker. Ne pas complexifier inutilement le POC.

## Stack imposée

- pnpm
- React + Vite
- Express.js
- Socket.IO
- MongoDB Atlas + Prisma 6
- Multer + Sharp
- Cloudinary
- JavaScript (pas de TypeScript)

## Architecture

- frontend/ : application React
- backend/ : API Express
- Séparation simple des responsabilités
- Pas de framework supplémentaire sans validation

## Règles de développement

1. Lire docs/SPEC.md et docs/TASKS.md.
2. Traiter une seule tâche à la fois.
3. Proposer un plan avant toute modification importante.
4. Modifier uniquement les fichiers nécessaires.
5. Privilégier la solution la plus simple.
6. Ne pas ajouter de fonctionnalités non demandées.
7. Ne jamais inventer de résultats de tests.
8. Signaler les problèmes et les incertitudes.

## Sécurité

- Ne jamais exposer les secrets.
- Valider les fichiers reçus côté serveur.
- Décoder et réencoder les images avec Sharp.
- Limiter la taille des uploads.
- Ne jamais exposer les identifiants Cloudinary.

## Validation

Après chaque tâche :

- Expliquer les modifications.
- Indiquer comment tester.
- Exécuter les tests disponibles.
- Signaler ce qui reste à vérifier.

## Interdictions

- Pas de Docker le premier jour.
- Pas d'authentification.
- Pas de fonctionnalités bonus.
- Pas de sur-ingénierie.
