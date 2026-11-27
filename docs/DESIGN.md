# FamilyFrame — Design des deux écrans

## Revue du 27 novembre 2026

Le formulaire passe au premier plan. Les boutons distinguent le choix d'un fichier
et la prise de photo. Après la sélection, le nom du fichier et l'action « Retirer »
restent visibles. Le formulaire signale immédiatement un fichier vide ou trop gros.
Sur mobile, le visuel décoratif laisse la place au formulaire.

Le cadre distingue la connexion en cours, le direct actif et le direct interrompu.
L'écran vide invite à partager la première photo et une erreur de chargement permet
de réessayer. La photo principale s'affiche entière devant un fond vert sombre.

## Direction

Un album de famille contemporain : fond ivoire, vert sapin, titres élégants et photos présentées comme des tirages papier. Le parcours reste celui du POC : pseudo, photo, envoi, affichage en direct.

## Choix visuels

- Fond : `#f4f2ea`, pour une ambiance douce et chaleureuse.
- Texte et boutons : `#243f34`, pour une lecture nette et une action principale reconnaissable.
- Titres : Instrument Serif, avec une touche d’italique dans l’accroche.
- Champs, navigation et informations : DM Sans, pour faciliter la lecture.
- Les polices sont fournies localement, avec leurs licences OFL dans `frontend/public/fonts/`.
- L’image de cuisine est une illustration photographique générée pour cette interface. Elle est décorative : elle ne représente pas une photo réellement envoyée par une famille.
- Cette image est convertie en WebP ; le cadre affiche toujours les vraies photos reçues par l’API.

## Fichiers concernés

| Fichier | Ce qui a changé et pourquoi |
| --- | --- |
| `frontend/src/App.jsx` | En-tête, navigation, accroche, tirage décoratif et pied de page : donner une identité commune aux deux pages. |
| `frontend/src/PhotoForm.jsx` | Sélecteurs de fichier et de caméra habillés, aperçu local, messages distincts : rendre l’envoi plus clair. |
| `frontend/src/Frame.jsx` | Présentation de la dernière photo, légende, état du direct et anciens souvenirs : mettre les photos au premier plan. |
| `frontend/src/Icon.jsx` | Quelques petites icônes SVG cohérentes, regroupées dans un seul composant, sans dépendance supplémentaire. |
| `frontend/src/index.css` | Couleurs, typographies, espacements, mobile, focus clavier et animation d’arrivée d’une photo. |
| `frontend/index.html` | Icône d’onglet, couleur du navigateur, description et préchargement des polices principales. |
| `frontend/public/` | Image décorative, polices avec licences et favicon : les ressources visuelles utilisées par le navigateur. |

## Comportement

L’aperçu utilise une URL locale temporaire créée par `URL.createObjectURL`. Choisir un fichier ne l’envoie pas au serveur. Cette URL est libérée quand l’aperçu change ou quand le formulaire est quitté.

Sur mobile, la photo décorative est masquée et les éléments passent sur une colonne pour donner la priorité au formulaire. Les photos du cadre sont affichées entièrement avec `object-fit: contain`.

La navigation au clavier dispose d’un focus visible et d’un lien pour aller directement au contenu. Les animations sont désactivées si le système demande de réduire les mouvements.

## Vérifications — 23 novembre 2026

- Frontend : `pnpm lint`, `pnpm build` et les 3 tests réussis.
- Backend : les 10 tests réussis, dont le test parent. Cette suite utilise des substituts pour les services externes.
- Navigateur : sélection de fichier, aperçu, pseudo composé d’espaces, fichier dépassant 5 Mo et erreur serveur sur une fausse image vérifiés.
- Cadre : connexion au direct, vraies images existantes et ouverture/fermeture des souvenirs précédents vérifiées.
- Responsive : deux écrans vérifiés à 390 px dans un aperçu isolé de la vraie application, sans débordement horizontal ; rendu ordinateur vérifié à 1280 px.
- Le texte indicatif du champ a été assombri pour atteindre un contraste de 4,96:1 sur son fond.
- Captures de travail conservées localement dans `output/design/`.
- Le détecteur visuel signale deux avertissements concernant Instrument Serif. Cette police est conservée intentionnellement pour correspondre à la direction visuelle.

L’envoi réussi avec Cloudinary et Atlas avait été validé pendant J1. Pour cette refonte visuelle, aucun nouvel envoi réussi n’a remplacé les photos existantes. La capture avec la caméra d’un vrai smartphone reste à essayer.

Le PDF pédagogique J1 reste une photographie du code avant cette refonte ; ses extraits du frontend ne décrivent donc pas les nouveaux éléments visuels.
