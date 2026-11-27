# FamilyFrame — Plan de développement

- [x] T01 — Initialiser frontend et backend
- [x] T02 — Créer le formulaire React
- [x] T03 — Créer l'API Express
- [x] T04 — Recevoir et traiter les images
- [x] T05 — Intégrer Cloudinary
- [x] T06 — Connecter MongoDB avec Prisma
- [x] T07 — Créer la route GET /photos
- [x] T08 — Intégrer Socket.IO
- [x] T09 — Afficher la dernière photo
- [x] T10 — Tester le parcours complet

## Règles

- Une tâche à la fois.
- Ne cocher qu'après vérification.
- Documenter les blocages.
- Ne pas commencer les bonus avant T10.

## Validation J1 — 23 novembre 2026

- T01 : frontend React/Vite et backend Express démarrés en local, en JavaScript avec pnpm.
- T02 : champs obligatoires, pseudo composé d'espaces, sélection du fichier, envoi,
  messages d'erreur et réinitialisation après succès vérifiés dans Chrome.
- T03 : GET /health répond 200 ; une route inexistante répond 404.
- T04 : vraie conversion PNG → JPEG avec Sharp, limite de 5 Mo, contrôle du pseudo,
  refus des faux fichiers, types non acceptés, images trop grandes et multipart mal formé.
- T05 : compte Cloudinary rattaché ; vrais uploads, lecture des images en HTTPS 200
  et décodage vérifiés. Les images temporaires des premiers tests ont été supprimées.
- T06 : cluster Atlas FamilyFrame sur l'offre Free, IP courante autorisée et utilisateur
  limité à readWrite sur familyframe. Connexion réelle avec Prisma 6 réussie.
  La collection photos et l'index de date ont été créés par pnpm db:push.
- T07 : GET /photos retourne les vraies métadonnées enregistrées, de la plus récente à la plus ancienne.
- T08 : événements photo:new reçus sur le cadre avec les vrais services, sans actualiser la page.
- T09 : dernière photo prioritaire, pseudo et date affichés ; ancienne photo consultable.
- T10 : deux images envoyées depuis le formulaire dans un navigateur, enregistrées sur Cloudinary
  et Atlas, reçues sur un second onglet. Après arrêt et redémarrage du backend puis rechargement
  du cadre, les deux mêmes documents sont retrouvés dans le même ordre.

## Tests disponibles

- Backend : pnpm test — 9 cas plus leur test parent ; services externes remplacés dans cette suite.
- Frontend : pnpm test — 3 cas sur le tri et les doublons.
- Frontend : pnpm lint et pnpm build réussis.
- Le parcours navigateur avec les vrais comptes a été vérifié séparément des tests avec substituts.
- Deux images de démonstration sont conservées pour revoir le résultat sur le cadre.

## Vérification complémentaire

La prise de photo avec une caméra de smartphone physique reste à essayer.
La sélection et l'envoi de fichiers dans un navigateur sont validés ; les possibilités
natives de capture dépendent du navigateur mobile.

## FamilyFrame 2.0

- [x] Créer et rejoindre des cadres avec un code et un QR code.
- [x] Vérifier côté serveur les sessions HttpOnly pour l'accès aux photos.
- [x] Isoler les événements Socket.IO dans la room du cadre autorisé.
- [x] Tester le rattachement des anciennes photos sur une base de test.
- [x] Vérifier l'envoi et la lecture protégée d'une image synthétique avec Cloudinary.
- [ ] Rattacher les photos existantes après avoir choisi leur cadre de destination.
