# Reprendre le travail sur Uplye Group OS

Ce fichier sert de mémoire au projet. Une nouvelle conversation (ou une autre personne) doit pouvoir repartir d'ici
sans relire l'historique. **À mettre à jour à la fin de chaque séance de travail.**

Dernière mise à jour : 19 octobre 2026.

## Où sont les choses

| Quoi | Où |
|---|---|
| **Uplye OS v2** (refonte sur le nouveau Figma, à privilégier) | `uplye-os-v2/` (voir `uplye-os-v2/README.md`) · démo https://claude.ai/artifact/Sg8AQAJmzLMze4qRXkMP3c |
| Figma v2 (design system shadcn + 100 écrans) | fichier `A50zmdlWg9tb1DBoCkaYD8` |
| Prototype v1 (React, données fictives) | `uplye-os/` · branche `claude/magical-cray-hcwsby` |
| Démo en ligne du prototype | https://claude.ai/artifact/Q32WBpkZJzKKQHC7QRvrCd |
| Catalogue 2027 de travail (réunion du 16 oct.) | https://claude.ai/artifact/7w4RNen9wzAonFTxmNuWkQ |
| Maquettes et design system | Figma, fichier `rg1KuWYKJvxNP79Wp8azbx`, page « ↪ Uplye OS » |
| Règles de sécurité (non négociables) | `SECURITY.md` |
| Fonctionnalités du prototype | `uplye-os/README.md` |

### Figma : plan de la page « ↪ Uplye OS »

Sections empilées de haut en bas : 01 Design system · 02 Auth · 03 Pilotage · 04 Commercial · 05 Production ·
06 Admin & compte · 07 Côté client · 08 Finance · 09 États vides · 10 Réseaux sociaux. Écart de 240 px entre sections,
à respecter quand on en agrandit une.

Design system (section 01) :
- Variables : collection « Uplye OS » (couleurs, modes Clair et Sombre, nom CSS `var(--os-…)`), collection
  « Uplye OS · Dimensions » (space, radius, size). Styles de texte `OS/*`, ombres `OS/Shadow/*`, `OS/Focus ring`.
- Composants principaux : Sidebar (Rôle Admin/Production × Mode Étendu/Réduit), Nav item, Page header, Button
  (Style × Size × State), Icon button, Field, Tab, Toggle, Checkbox, Pill, Badge / Statut, Tag / Type, Avatar,
  KPI card, Table, Task card (badges rappel / changement), Notification, Modal, Menu, Tooltip, Toast, Calque,
  Événement, Jour, Réseau, Post, Post · mini, Compte connecté.
- Règle : tout nouvel écran se construit avec ces composants et ces variables, et avec les données « Figma »
  (Mayli Spa & Beauty, Institut Lumière du Sud, Club Royalty, Skeals, Laforêt). Alexis = « AX ».

## Uplye OS v2 (depuis le 19 oct.)

- Décisions : pile shadcn validée (Radix UI, class-variance-authority, clsx, tailwind-merge v2, Vitest + Testing Library + jsdom),
  nouveau dossier `uplye-os-v2/` (la v1 reste en ligne), ordre : base + Aujourd'hui, puis un module par séance
  (Commercial, Production, Finance, Admin, Portail).
- Fait : tokens Figma → `src/styles/tokens.css` (script `scripts/build-tokens.mjs`), 23 composants de base, shell,
  écran Aujourd'hui (états normal, chargement, tout traité), vitrine `#/systeme`, 19 tests.
- Module Commercial fait (séance du 19 oct.) : devis liste / pipeline / analyse, motifs gagné-perdu (repris des
  anciennes maquettes à la demande), nouveau devis, éditeur et envoi, clients et fiche, événements, réunions.
  47 tests. Écarts assumés : entrée « Réunions » ajoutée à la barre latérale ; remise globale + alerte 20 % ajoutées
  à l'éditeur (décision ci-dessous, absente du Figma v2) ; « Scanner une carte » = saisie manuelle en attendant le mobile.
- Module Production fait (19 oct.) : projets (liste, fiche, nouveau projet depuis un devis signé), Azurpod (livraisons,
  packs, calendrier jour/semaine/mois, nouvelle session), réseaux sociaux (semaine/mois/liste, comptes, éditeur de post,
  publication refusée). 65 tests au total. Écart assumé : libellés neutres « côté client » (le Figma écrit « cliente »).
  Dates partagées dans `src/lib/dates.ts`, équipe et date de démo dans `src/data/session.ts`.
- Prochain module v2 : Pilotage (Kanban, planning, charge équipe), puis Finance, Admin, Portail.
- Figma v2 : pages 01 Foundations, 02 Components (≈ 50 composants), 03 Icons (Phosphor), 10 à 16 = écrans par module.
  Les composants métier (Deal Card, Kanban Card, Phase Bar…) se codent avec leur module.
- Vérifier : `cd uplye-os-v2 && npm run check && npm run build`.

## Décisions prises (ne pas remettre en question sans demander)

**Rôles**
- Enzo et Allan : admins. Alexis : production (vidéaste, alternance).
- Alexis ne voit pas les montants, ne change pas le responsable ni l'étape d'un projet, ne crée des tâches que pour
  lui, consulte Azurpod sans modifier les réservations. Ses changements d'échéance, de durée ou d'assigné partent
  en demande à valider par un admin.
- Réseaux sociaux : **pas de validation dans l'outil** (validée de vive voix). Seule la connexion des comptes est
  réservée aux admins.

**Produit**
- Étapes projet : Brief → Préproduction → Tournage → Montage → Retours client → Livré.
- Réseaux sociaux : calendrier **séparé** du Planning (ne pas en faire un calque du Planning).
- Planning : calques Uplye Studio / Azurpod / Uplye Academy / Interne.
- Devis : remise commerciale globale en € ou en %, alerte au-delà de 20 %.
- Parrainage client : 5 % en commission ou 10 % en crédit.

**Catalogue (réunion du 16 oct.)** : voir la page du catalogue de travail. Décidé : reportage événement 500 / 900 €
(150 / 300 photos), reportage entreprise 750 / 1 200 €, portraits d'équipe 390 à 590 €, suivi de chantier dès 500 €,
phase de retours 150 €, drone 290 €, lancement Meta 490 €, abonnement photo trimestriel, retrait du portrait LinkedIn,
du home staging et de TikTok, Google Ads sous-traité donc plus cher. À finir : services complémentaires (branding,
site, SEO, podcast, formation), temps passé et marge par prestation, ce qui est sous-traité.

## Comment on travaille

- Prototype : Vite + React + TypeScript + Tailwind, icônes Phosphor, état dans `src/store.tsx` (localStorage,
  clé `uplye-os-demo-v2`). Les nouvelles collections ont des données de démo dans `src/data*.ts`.
- Vérifier : `npx tsc -b` puis `npm run build`. Tester dans Chromium (Playwright) avant de dire que c'est prêt.
- Republier la démo : `npm run build:single`, puis publier `dist-single/index.html` sur l'artefact ci-dessus
  (même lien).
- Aucune nouvelle dépendance sans validation. Données fictives uniquement. Checklist sécurité de `SECURITY.md`
  à chaque livraison.
- Pages Figma : chaque modification d'écran doit rester cohérente avec les autres écrans (mêmes clients, mêmes
  dates, mêmes règles de rôles).

## Points ouverts

- Les commentaires laissés dans Figma ne sont pas lisibles par Claude : les coller dans la conversation.
- Les données du prototype (Boulangerie, Hôtel Les Pins…) diffèrent de celles des maquettes Figma : à aligner si besoin.
- Planning : vue mois dans Figma, vue semaine par personne dans l'app. Choisir la référence.
- Passage en vraie app : Supabase (RLS et policies sur chaque table), routes serveur avec contrôle d'identité et de
  droits, connexion Meta côté serveur pour les réseaux sociaux, variables d'environnement dans `.env.example`.

## Phrase pour relancer une nouvelle conversation

> On reprend Uplye Group OS. Lis `CLAUDE.md`, `SECURITY.md` et `docs/REPRISE.md`, puis on continue sur [sujet].
