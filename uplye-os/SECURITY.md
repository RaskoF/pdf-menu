# Sécurité d'Uplye OS

Ce fichier liste les règles de sécurité à respecter avant de brancher de vraies données (banque, comptabilité,
clients, projets). Toute personne ou tout agent qui développe sur le projet le lit avant de coder.

> Le prototype actuel n'est **pas** fait pour de vraies données : tout est stocké dans le navigateur, sans compte
> ni chiffrement. Il sert uniquement à tester l'ergonomie, avec des données fictives.

## 1. Banque et comptabilité

- On ne stocke **jamais** d'identifiants bancaires.
- Connexion par l'API officielle de la banque (Qonto) ou par un agrégateur agréé DSP2 (ex. Bridge, Powens) pour une
  banque traditionnelle ; API officielle pour Pennylane.
- Accès en **lecture seule** : l'application ne peut pas initier de virement.
- Les jetons d'accès sont chiffrés, stockés côté serveur uniquement, jamais envoyés au navigateur.

## 2. Qui voit quoi

| Rôle | Accès |
|---|---|
| Admin (Enzo, Allan) | tout |
| Production (Alexis) | ses projets et ses tâches, sans montants, devis, clients ni finance |
| Client | uniquement ses projets, devis et fichiers, via le portail |

- Les règles sont appliquées **par la base de données** (sécurité au niveau des lignes), pas seulement par l'interface.
- Chaque nouvelle page est testée avec les trois rôles avant d'être livrée.

## 3. Connexion

- Double authentification obligatoire pour les admins.
- Clients : lien magique à durée limitée, rattaché à leur seul espace.
- Sessions qui expirent ; déconnexion à distance possible.

## 4. Données et hébergement

- Hébergement dans l'Union européenne (RGPD).
- Chiffrement en transit (HTTPS) et au repos.
- Sauvegardes quotidiennes, restauration testée au moins une fois par trimestre.
- Journal d'activité : qui a consulté, modifié ou exporté quoi.

## 5. Fichiers (rushs, livrables)

- Stockage privé, liens de téléchargement signés et temporaires.
- Aucun lien public permanent.

## 6. Assistant IA et intégrations

- On n'envoie à l'IA que les données nécessaires à la tâche ; jamais de données bancaires brutes.
- Fireflies, WhatsApp, Webflow : jetons stockés comme ceux de la banque, droits minimum.

## 7. RGPD

- Registre des traitements et liste des sous-traitants (hébergeur, banque, Fireflies…) avec contrats de traitement.
- Durée de conservation définie pour les données clients ; suppression sur demande.

## 8. Développement

- Données fictives en développement ; jamais de vraies données sur un environnement de test.
- Aucun secret (mot de passe, clé d'API) dans le code ni dans Git : variables d'environnement uniquement.
- Dépendances mises à jour et vérifiées ; revue de code avant chaque mise en ligne.
- Audit de sécurité avant de brancher la banque et avant l'ouverture du portail client.
