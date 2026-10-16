# Uplye OS · prototype

Prototype cliquable d'Uplye OS (Commercial, gestion de projet et Finance), avec des **données fictives** (aucun vrai client).
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

- **Projets** : cartes avec étapes, budget, marge et échéance ; **fiche projet** avec étapes cliquables, tâches,
  coûts directs, temps passé valorisé (35 € HT/h) et factures liées. Un devis signé crée son projet et sa facture d'acompte.
- **Kanban** : tâches par statut (à faire, en cours, review, bloqué, fait), glisser-déposer, filtres équipe / projet,
  durée libre de 30 min à 40 h.
- **Planning / Workload** : semaine par personne, charge comparée à la capacité, glisser une tâche pour la replanifier.
- **Finance** (admins) : synthèse avec choix de période (CA facturé, encaissé, charges, résultat, graphique 12 mois,
  indicateurs, meilleurs clients), factures à encaisser avec relance et prévision de trésorerie sur 3 mois,
  charges fixes et abonnements, marge par projet.

- **Dashboard** : chiffres du mois, alertes (factures et projets en retard, surcharge, tâches bloquées, sessions à monter),
  « Ma journée », semaine à venir, devis à relancer, charge de l'équipe.
- **Azurpod** : agenda du studio (clic sur un créneau libre pour réserver, conflits et horaires vérifiés),
  formules Standard / Pré-montage / Clé en main, sessions et livrables, packs d'heures avec heures restantes.
- **Rôles** : le sélecteur sous le nom (barre latérale) permet de voir l'app en Enzo, Allan ou Alexis. En vue
  Production (Alexis), devis, clients, finance et montants sont masqués et leurs pages bloquées.

- **Événements** : networking, salons, conférences ; contacts rencontrés avec leur statut, « Créer le prospect »
  (crée le client et une carte « À chiffrer » dans le pipeline), CA signé issu des événements.
- **Équipe** : fiches membres, charge de la semaine, absences, invitation (préparée, non envoyée), tableau « qui voit quoi ».
- **Catalogue** : prestations, prix et unité, temps interne et coûts directs, marge estimée, utilisation dans les devis,
  archivage. L'éditeur de devis lit ce catalogue. Règles de sécurité : voir `SECURITY.md` à la racine du dépôt.
- **Planning par calques** : afficher / cacher Uplye Studio, Azurpod, Uplye Academy et Interne (mémorisé), ligne
  « Studio Azurpod » avec les sessions de la semaine.
- **Rappels d'échéance** : badges « En retard / aujourd'hui / demain » sur le Kanban, cloche de notifications
  (barre latérale) et alertes du Dashboard.
- **Validation des changements sensibles** : quand Alexis modifie l'échéance, la durée ou l'assigné d'une tâche
  (fiche ou glisser dans le planning), le changement part en demande ; un admin l'accepte ou le refuse depuis la
  cloche, et Alexis est notifié. Alexis ne peut ni supprimer de tâche ni changer l'étape d'un projet.
- **Projets en Kanban** : bascule Cartes / Kanban par étape (préproduction → livré), glisser-déposer pour les admins.
- **Process (SOP)** : trames R1 / R2, relance devis, tournage, montage, Azurpod, onboarding, offboarding, facturation.
  Étapes éditables par les admins, « Suivre ce process » crée une checklist (ex. « Onboarding Alexis »).
- **Espace client** (`#/portail/<id-client>`, bouton « Espace client » sur la fiche) : projets avec avancement,
  factures, et **parrainage** : lien et code, recommandation d'un filleul, choix 5 % en commission ou 10 % en crédit,
  suivi des gains. Côté OS, la fiche client liste les filleuls, le passage en signé et le règlement.

## Stack

Vite + React + TypeScript, Tailwind CSS, icônes Phosphor, polices Barlow Condensed / Hanken Grotesk / DM Mono
(couleurs et typos reprises des variables du Figma Uplye OS).
