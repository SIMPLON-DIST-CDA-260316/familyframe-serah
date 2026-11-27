# FamilyFrame — Spécifications

## Objectif

Envoyer une photo depuis un navigateur et l'afficher sur un autre écran en temps réel.

## Parcours utilisateur

1. Saisir un pseudo.
2. Sélectionner ou prendre une photo.
3. Envoyer la photo.
4. Afficher automatiquement la dernière photo sur le cadre numérique.

## Contraintes

- Images traitées avec Multer et Sharp.
- Stockage des images sur Cloudinary.
- Métadonnées enregistrées dans MongoDB.
- Communication temps réel avec Socket.IO.
- Dernière photo prioritaire.
- Anciennes photos récupérables.

## FamilyFrame 2.0

- Créer plusieurs cadres indépendants et rejoindre chacun par code ou QR code.
- Vérifier les invitations côté serveur et ouvrir une session par cadre dans un cookie HttpOnly.
- Protéger la lecture, l'envoi et la diffusion des photos par cadre.
- Prévoir une migration explicite des anciennes photos vers un cadre choisi.

## Hors périmètre de la version 1

- Authentification
- Gestion de plusieurs familles
- Galerie avancée
- Docker (prévu après le POC)
