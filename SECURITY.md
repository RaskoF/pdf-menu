# Règles de sécurité du projet

Ces règles sont non négociables. Tu les appliques avant d'écrire du code qui touche aux secrets, aux routes API, aux webhooks ou à la base de données. Si une règle t'empêche de faire ce qui est demandé, tu le signales au lieu de la contourner.

## Secrets et clés d'API

- N'écris JAMAIS une clé, un token, un mot de passe ou une URL de connexion en dur dans le code, dans un commentaire, dans un fichier de config versionné ou dans un exemple.
- Toute valeur sensible passe par une variable d'environnement lue côté serveur.
- N'utilise le préfixe `NEXT_PUBLIC_` que pour des valeurs qui peuvent être lues par n'importe quel visiteur. En cas de doute, pas de préfixe.
- `.env`, `.env.local`, `.env.*.local`, `*.pem` et `.claude/settings.local.json` sont dans `.gitignore`. Ne les retire pas.
- Si tu as besoin d'une nouvelle variable d'environnement, ajoute-la à `.env.example` avec une valeur vide et préviens-moi.

## Routes API et webhooks

- Chaque route API vérifie d'abord l'identité de l'appelant, puis ses droits sur l'objet demandé. Les deux, pas l'une des deux.
- Chaque webhook entrant vérifie un secret partagé (en-tête dédié) ou une signature fournisseur. Jamais de webhook ouvert, même en interne, même temporairement.
- N'utilise jamais un identifiant passé par le client pour décider de ce qu'il a le droit de voir. L'identité vient de la session.
- Mets un rate limit sur : authentification, reset de mot de passe, appels LLM, envoi d'email, et tout formulaire public.
- Ne désactive pas une vérification de signature pour faciliter un test. Utilise l'outil de test du fournisseur.

## Base de données

- Toute nouvelle table est créée avec le RLS activé, sans exception, y compris les tables internes.
- Chaque table a des policies explicites par opération (select, insert, update, delete). Pas de policy ouverte `using (true)` sans que je l'aie validée.
- La clé service role n'est utilisée que dans du code serveur. Elle n'apparaît jamais dans un composant client, un hook ou un fichier accessible au navigateur.
- Pas de migration destructive (`drop`, `truncate`, `delete` sans clause) sans me demander d'abord.

## Données de développement

- Tu travailles sur la base de développement avec des données factices. Tu ne te connectes jamais à la base de production.
- Si tu as besoin de données réalistes, génère un jeu de données factices ayant la même structure.

## Dépendances, skills et serveurs MCP

- N'installe pas de dépendance, de skill ou de serveur MCP de ta propre initiative. Propose-le, explique ce qu'il fait et ce à quoi il accède, et attends ma validation.
- Préfère toujours une solution avec les dépendances déjà présentes dans le projet.

## Avant de me dire que c'est prêt

Vérifie et dis-moi explicitement :
1. Aucun secret en dur ajouté.
2. Les nouvelles routes vérifient identité ET droits.
3. Les nouvelles tables ont le RLS et des policies.
4. Aucune clé secrète exposée côté client.

---

## Spécifique à Uplye OS

Ces points complètent les règles ci-dessus pour les données propres à l'application.

### Banque et comptabilité
- On ne stocke jamais d'identifiants bancaires. Connexion par l'API officielle (Qonto, Pennylane) ou un agrégateur agréé DSP2 pour une banque traditionnelle.
- Accès en lecture seule : l'application ne peut pas initier de virement. Les jetons sont chiffrés et restent côté serveur.

### Qui voit quoi (appliqué par les policies RLS)
| Rôle | Accès |
|---|---|
| Admin (Enzo, Allan) | tout |
| Production (Alexis) | ses projets et ses tâches, sans montants, devis, clients ni finance |
| Client | uniquement ses projets, devis et fichiers, via le portail |

Chaque nouvelle page est testée avec les trois rôles avant d'être livrée.

### Connexion
- Double authentification obligatoire pour les admins ; lien magique à durée limitée pour les clients ; sessions qui expirent.

### Hébergement, fichiers et RGPD
- Hébergement dans l'Union européenne, chiffrement en transit et au repos, sauvegardes quotidiennes avec restauration testée, journal d'activité.
- Fichiers (rushs, livrables) en stockage privé, liens signés et temporaires, aucun lien public permanent.
- Registre des traitements, contrats avec les sous-traitants, durée de conservation définie, suppression sur demande.

### Assistant IA et intégrations
- On n'envoie à l'IA que les données nécessaires à la tâche, jamais de données bancaires brutes.
- Fireflies, WhatsApp, Webflow : jetons traités comme ceux de la banque, droits minimum, webhooks signés.

### Prototype actuel (`uplye-os/`)
Le prototype n'a ni serveur, ni base, ni compte : tout est dans le navigateur avec des données fictives. Il sert uniquement à tester l'ergonomie. Les règles « routes API » et « base de données » s'appliqueront dès la première vraie route ou table.
