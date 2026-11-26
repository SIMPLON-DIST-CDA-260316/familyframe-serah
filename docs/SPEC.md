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

## Hors périmètre du POC

- Authentification
- Gestion de plusieurs familles
- Galerie avancée
- Docker (prévu après le POC)
