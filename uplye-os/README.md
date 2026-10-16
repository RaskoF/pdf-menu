# Uplye OS · prototype « Commercial »

Prototype cliquable de la partie Commercial d'Uplye OS, avec des **données fictives** (aucun vrai client).
Les modifications sont gardées dans le navigateur (localStorage) ; le bouton « Remettre les données de démo »,
en bas de la barre latérale, repart de zéro.

## Lancer en local

```bash
cd uplye-os
npm install
npm run dev        # puis ouvrir http://localhost:5173
```

`npm run build:single` produit un seul fichier HTML autonome dans `dist-single/` (pratique pour partager une démo).

## Ce qui est branché

- **Devis** : indicateurs (pipeline, pondéré, taux de signature, délai), filtres, vue **Liste** triable et vue **Pipeline**
  (glisser-déposer entre étapes, colonne « Refusé » repliable, ajout de prospect).
- **Éditeur de devis** : titre, texte projet, prestations depuis le Catalogue ou libres, quantités, remises, lignes offertes,
  totaux HT / TVA / TTC, échéancier, validité, relances, envoi du lien, duplication, suivi.
- **Page devis côté client** (`#/devis/<id>/client`) : récapitulatif, échéancier et « Bon pour accord » qui passe le devis en Signé.
- **Clients** : liste avec CA signé et devis en cours, création d'un client, **fiche client** (indicateurs, devis, contact,
  historique, notes).

Les autres entrées du menu affichent « pas encore développé ».

## Stack

Vite + React + TypeScript, Tailwind CSS, icônes Phosphor, polices Barlow Condensed / Hanken Grotesk / DM Mono
(couleurs et typos reprises des variables du Figma Uplye OS).
