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
  Dropdown Menu, Tooltip, Progress, Skeleton, Separator, Card, Alert, Toast, Dialog, Chip.
  Vitrine : `#/systeme` (menu du compte → Design system).
- **Shell** (`src/layouts/app-shell.tsx`, `src/components/app`) : barre latérale repliable, tiroir sur mobile, raccourcis
  ⌘K (recherche) et ⌘J (assistant), thème clair/sombre mémorisé, lien d'évitement « Aller au contenu ».
- **Aujourd'hui** (`src/features/today`) : tâches groupées (urgent, aujourd'hui, en attente), filtres par pôle,
  cases à cocher avec annulation, états chargement et « tout est à jour », cash du mois, charge de l'équipe,
  prochain rendez-vous.
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

Commercial (devis, éditeur, clients, événements, réunions), Production (projets, Azurpod, réseaux sociaux, Kanban,
planning, charge), Finance, Admin, Portail client, puis recherche, notifications et assistant.
