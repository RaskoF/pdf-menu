# Roadmap Uplye OS · 01 Authentification

Brief à faire valider par Elias. Mis à jour le 29 octobre 2026.

## Décisions prises

- Interface en **React** (base `uplye-os-v2/`), données, comptes et fichiers sur **Supabase** (hébergé dans l'UE).
- **Pas d'inscription libre.** Tous les comptes sont créés par invitation :
  l'équipe par un admin, les clients depuis leur projet ou leur devis.
- **Équipe** : e-mail + mot de passe uniquement (pas de connexion Google).
  Double authentification par application (code à 6 chiffres) obligatoire pour les admins.
- **Clients** : connexion par lien magique envoyé par e-mail, sans mot de passe.
- Rôles : Admin (Enzo, Allan ; Enzo super admin), Production (Alexis), Client.

## Écrans

| # | Écran | Pour qui | Figma |
|---|---|---|---|
| 1 | Connexion | Équipe | existe, à compléter |
| 2 | Double authentification (configuration + saisie) | Admins | saisie existe, configuration manque |
| 3 | Mot de passe oublié (demande, nouveau mot de passe, lien expiré) | Équipe | manque |
| 4 | Activation du compte (depuis l'invitation) | Équipe | existe, à compléter |
| 5 | Connexion par lien magique (demande, lien envoyé, lien expiré, premier accès) | Clients | « lien envoyé » existe |
| 6 | Session expirée | Tous | manque |
| 7 | Équipe : inviter, renvoyer, annuler, désactiver, réinitialiser la 2FA | Admins | à vérifier |
| 8 | Mon compte > Sécurité | Équipe | manque |

### 1. Connexion (équipe)
- Logo Uplye, titre « Connexion ».
- E-mail, mot de passe (bouton afficher / masquer), lien « Mot de passe oublié ? ».
- Case « Se souvenir de cet appareil ».
- Bouton « Se connecter » avec état de chargement.
- Erreurs :
  - identifiants incorrects : même message que l'e-mail existe ou non ;
  - trop de tentatives : « Réessaie dans 15 min » ;
  - compte désactivé.
- Les admins enchaînent sur l'écran 2.

### 2. Double authentification (admins)
- **Configuration (première connexion)** :
  - QR code et clé à saisir à la main ;
  - 10 codes de secours à télécharger ou copier ;
  - case « J'ai sauvegardé mes codes » obligatoire.
- **Saisie (chaque connexion)** :
  - 6 cases, validation automatique au 6e chiffre ;
  - lien « Utiliser un code de secours ».
- Erreurs : code faux, code expiré, trop d'essais.

### 3. Mot de passe oublié
- **Demande** : champ e-mail. Message toujours identique : « Si un compte existe, on t'a envoyé un lien ».
- **Nouveau mot de passe** :
  - saisi deux fois, règles affichées en direct ;
  - après validation, déconnexion de toutes les autres sessions.
- **Lien expiré ou déjà utilisé** : bouton « Renvoyer un lien ».

### 4. Activation du compte (équipe)
- Prénom et nom préremplis, e-mail verrouillé, rôle affiché.
- Choix du mot de passe avec ses règles. Photo de profil facultative.
- Acceptation des conditions d'utilisation et de la politique de confidentialité.
- Admin : enchaîne sur la configuration de la double authentification.
- État « Invitation expirée, demande-en une nouvelle à ton admin ».

### 5. Lien magique (clients)
- **Demande** : e-mail, bouton « Recevoir mon lien de connexion ».
- **Lien envoyé** : rappel de l'adresse, « Renvoyer » actif après 60 s, « Changer d'adresse ».
- **Lien expiré ou déjà utilisé** : bouton pour en recevoir un nouveau.
- **Premier accès** : nom, société, téléphone, consentement au traitement des données (RGPD).

### 6. Session expirée
- « Ta session a expiré, reconnecte-toi. » Retour sur la page demandée après reconnexion.

### 7. Équipe (côté admin)
- Inviter : e-mail, prénom, nom, rôle.
- Liste des invitations avec statut (en attente, acceptée, expirée), renvoyer ou annuler.
- Désactiver un compte (pas de suppression, l'historique est gardé).
- Réinitialiser la double authentification d'un membre.

### 8. Mon compte > Sécurité
- Changer de mot de passe.
- Double authentification : régénérer les codes de secours.
- Sessions actives (appareil, ville, date) et « Déconnecter partout ».

## E-mails à rédiger et maquetter

1. Invitation équipe
2. Invitation client
3. Lien magique
4. Réinitialisation du mot de passe
5. Alerte « Nouvelle connexion depuis un appareil inconnu »
6. « Ta double authentification a été réinitialisée »

## Valeurs proposées, à confirmer par Elias

| Élément | Proposition |
|---|---|
| Session équipe | 12 h d'inactivité, 30 jours maximum |
| Session client | 7 jours |
| Lien magique | 15 min, usage unique |
| Invitation | 7 jours |
| Lien mot de passe oublié | 1 h, usage unique |
| Limite de tentatives | 5 essais en 15 min (connexion, lien magique, mot de passe oublié, code 2FA) |
| Mot de passe | 12 caractères minimum, refus des mots de passe déjà piratés |

## Questions ouvertes

**Pour Elias**
1. Hébergement de l'interface (Vercel ou autre) et région des données Supabase (UE obligatoire). Coût mensuel.
2. Adresses : application (ex. `app.uplye.com`), portail client, adresse d'envoi des e-mails (SPF, DKIM).
3. Service d'envoi des e-mails transactionnels.
4. Journal d'activité (connexions, échecs, réinitialisations) : durée de conservation.

**Pour Enzo et Allan**
5. Double authentification obligatoire aussi pour Alexis ?
6. Vouvoiement ou tutoiement côté client ?

## Sécurité (rappel de `SECURITY.md`)

- Aucun secret dans le code ; clés dans des variables d'environnement côté serveur, listées dans `.env.example`.
- RLS activé et policies par opération sur chaque table ; clé service role uniquement côté serveur.
- Chaque page testée avec les trois rôles avant livraison.
