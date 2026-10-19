# Uplye OS · v2

Refonte d'Uplye OS sur le nouveau design system Figma (fichier `A50zmdlWg9tb1DBoCkaYD8`, basé sur shadcn/ui).
Données **fictives** uniquement : aucun vrai client, aucune connexion à une base de données.

## Lancer

```bash
cd uplye-os-v2
npm install
npm run dev          # http://localhost:5173
npm run check        # types + lint + tests (à lancer avant chaque commit)
npm run build        # build de production dans dist/
npm run build:single # démo autonome en un seul fichier HTML (dist-single/)
```

## Ce qui est fait

- **Fondations** : les variables Figma (Primitives, Semantic clair/sombre, shadcn, Spacing, Radius, Typography) sont
  exportées dans `scripts/figma-tokens.json`, puis `node scripts/build-tokens.mjs` génère `src/styles/tokens.css`.
  Tailwind ne lit que ces variables : aucune couleur en dur dans les composants.
- **Composants de base** (`src/components/ui`, un fichier par composant du Figma « 02 Components ») : Button, Icon Button,
  Badge, Kbd, Avatar, Input, Textarea, Select, Checkbox, Radio, Switch, Field, Tabs (segmented / underline),
  Dropdown Menu, Tooltip, Progress, Skeleton, Separator, Card, Alert, Toast, Dialog, Sheet (panneau latéral), Chip,
  ChoiceGroup (choix en pastilles ou en segments).
  Vitrine : `#/systeme` (menu du compte → Design system).
- **Shell** (`src/layouts/app-shell.tsx`, `src/components/app`) : barre latérale repliable, tiroir sur mobile, raccourcis
  ⌘K (recherche) et ⌘J (assistant), thème clair/sombre mémorisé, lien d'évitement « Aller au contenu ».
- **Aujourd'hui** (`src/features/today`) : tâches groupées (urgent, aujourd'hui, en attente), filtres par pôle,
  cases à cocher avec annulation, états chargement et « tout est à jour », cash du mois, charge de l'équipe,
  prochain rendez-vous.
- **Commercial** (`src/features/commercial`, store partagé `store.tsx`, règles pures dans `lib.ts`) :
  - Devis (`#/devis`) : liste avec cartes d'attention (relances en retard, devis chaud, brouillon oublié), filtres,
    tri, sélection groupée, panneau de détail (relance relue, autre ton, activité) ; pipeline avec indicateurs et
    objectif du trimestre, glisser-déposer entre étapes (ou menu ⋯ au clavier), zones Refusé (motif demandé) et
    Archiver, annulation dans le toast ; onglet Analyse gagnés / perdus (anciennes maquettes remises sur le nouveau DS).
  - Motifs de signature (avec confettis) et de refus : vocabulaire fixe dans `reasons.ts`, il alimente l'analyse.
  - Nouveau devis : client existant ou prospect, départ depuis un RDV Fireflies, un modèle, un devis à dupliquer ou vierge.
  - Éditeur plein écran (`#/devis/:id/editeur`) : sections, checklist « Prêt à envoyer » avec points bloquants,
    lignes (prix, quantité, remise, offert, optionnelle, marge), remise commerciale globale en € ou en % avec alerte
    au-delà de 20 %, catalogue (touche /), suggestions issues du RDV, aperçu client, PDF (impression),
    envoi simulé avec états « Envoi en cours » et « Le devis n'est pas parti » (adresse en `.invalid`).
  - Clients (`#/clients`) : liste filtrable et triable, création, import CSV lu dans le navigateur ; fiche avec
    indicateurs, fil d'activité (notes, filtres), projets, devis et factures, fichiers, contacts, épinglés.
  - Événements (`#/evenements`) : rentabilité par événement, à venir, contacts rencontrés à relancer (messages relus
    puis envoyés), nouvel événement, saisie d'une carte de visite, état vide.
  - Réunions (`#/reunions`, entrée ajoutée à la barre latérale : absente du Figma) : compte rendu, création des
    tâches, impact sur le projet, moments clés, questions à l'assistant, transcription, copie du compte rendu, état
    « Fireflies déconnecté ».
- **Production** (`src/features/production`, store `store.tsx`, règles dans `lib.ts`) :
  - Projets (`#/projets`) : groupes « À surveiller » (blocage, budget temps dépassé, révisions épuisées, retard),
    « En bonne voie » et « Livrés ce mois », barre de phases, filtres et recherche ; fiche projet avec phases,
    tâches à cocher et passage à la phase suivante (avec Annuler), attendus côté client, budget temps et marge
    projetée (saisie de temps), révisions, livrables, aperçu de l'espace client ; nouveau projet depuis un devis
    signé du module Commercial (process, pilote, dates, tâches créées) ou projet libre.
  - Azurpod (`#/azurpod`) : livraisons promises en jours ouvrés (bloqué, à monter, en montage, livré), packs et
    saisons, chiffres du mois (tarifs du catalogue : 90 / 165 / 350 € HT de l'heure), calendrier jour / semaine /
    mois, nouvelle session sur les créneaux réellement libres avec décompte du pack, lien de réservation.
  - Réseaux sociaux (`#/reseaux-sociaux`) : semaine, mois et liste, filtres par marque, posts bloqués quand un compte
    est déconnecté (bandeau + reconnexion), comptes connectés, état « aucun compte » ; éditeur plein écran
    (`#/reseaux-sociaux/post/:id`) : marque, réseaux, format, médias (depuis un projet ou ajoutés depuis l'ordinateur,
    restent dans le navigateur), légende avec limite par réseau et réécritures, créneau conseillé, aperçus
    Instagram / Facebook / LinkedIn, validation avant de programmer, publication refusée « Compresser et renvoyer ».
- Les autres modules ont une page d'attente (`ComingSoonPage`) en attendant leur développement.

## Organisation

```
src/
  components/ui/    composants de base (shadcn + Radix), sans logique métier
  components/app/   composants propres à Uplye OS (sidebar, en-tête de page, états vides…)
  features/<module> écrans, logique (hooks), types et données de démo d'un module
  config/           navigation (source unique pour la barre latérale et les routes)
  data/             données de session fictives
  hooks/ lib/       utilitaires partagés (thème, raccourcis, formatage, cn)
  styles/           tokens générés + styles de base
```

## Règles

- Un composant Figma = un composant code, mêmes noms de variantes. Toujours passer par les tokens (`bg-card`,
  `text-muted-foreground`, `text-title-sm`…), jamais de valeur en dur.
- Accessibilité : Radix pour les composants interactifs, libellés obligatoires sur les boutons icône, focus visible.
- Chaque écran a ses tests (Vitest + Testing Library) à côté du code.
- Sécurité : voir `../SECURITY.md`. Le passage en vraie app (Supabase, routes serveur) se fera module par module.

## Prochaines étapes

Pilotage (Kanban, planning, charge équipe), Finance, Admin, Portail client, puis recherche, notifications et assistant.
