# Présenter FamilyFrame

## Introduction

« FamilyFrame permet d'envoyer une photo depuis un navigateur et de la voir
apparaître sur un autre écran. J'ai travaillé sur le parcours d'envoi et sur
l'environnement Docker, puis j'ai automatisé les tests et la publication de l'API. »

## Démonstration

1. Suivre le [README](../README.md) pour lancer l'API et MongoDB avec
   `docker compose up --build`, puis le frontend avec `pnpm dev`.
2. Ouvrir `/` et `/cadre` dans deux onglets. Choisir une photo de démonstration
   et montrer son aperçu, puis l'envoyer pour la voir apparaître dans le cadre.
   Vérifier la configuration Cloudinary avant cette partie.
3. Montrer le schéma d'architecture. Expliquer que Cloudinary stocke l'image
   et que MongoDB garde ses informations. Socket.IO signale la nouvelle photo
   au cadre pour qu'il se mette à jour.
4. Montrer le workflow GitHub Actions et
   [la PR de vérification #2](https://github.com/SIMPLON-DIST-CDA-260316/familyframe-serah/pull/2).
   Dire que les tests passent avant la publication et que le contrôle `tests`
   bloque une fusion vers `main` s'il échoue.

## Questions possibles

- **Quelle différence entre une image et un conteneur ?** Une image contient
  l'application et son environnement. Un conteneur est une instance qu'on
  crée et qu'on démarre à partir de cette image.
- **Que fait Compose ?** Il lance l'API et MongoDB, les met sur le même réseau,
  et attend que MongoDB soit prêt avant de lancer l'API.
- **Pourquoi un replica set ?** Prisma en a besoin pour les transactions
  MongoDB. Le contrôle de démarrage l'initialise sur une base neuve et vérifie
  que MongoDB accepte les écritures.
- **Quelle différence entre les deux montages ?** Le volume anonyme conserve
  les données dans `/data/db`. Le montage de `backend/src` partage le code
  de mon ordinateur avec l'API. `node --watch` redémarre le serveur à la sauvegarde.
- **Que fait le test Jest ?** Il donne deux photos dans le désordre à
  `mergePhotos` et vérifie que la plus récente arrive en premier.
- **Que reçoivent les camarades ?** Ils peuvent consulter le dépôt et, avec un
  accès au package privé Simplon, télécharger la version `:dev` de l'image.
