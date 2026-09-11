# Recap nettoyage - campagne cold emailing Azurpod

Source : 3 exports Apollo (73 colonnes chacun), reduits aux 14 colonnes utiles.
Perimetre retenu : departements 83 + 13.

## 1. Lignes avant / apres nettoyage

| Cercle | Lignes source | Lignes finales | Taux de conservation |
|---|---|---|---|
| Cercle 1 - Agences | 248 | 233 | 94.0 % |
| Cercle 2 - TPE/PME/ETI | 19 | 17 | 89.5 % |
| Cercle 3 - Centres de formation | 197 | 117 | 59.4 % |
| **Total** | **464** | **367** | **79.1 %** |

Detail des lignes ecartees, par etape :

| Cercle | Sans email | Non verifie | Generique | Doublon email | Doublon entreprise | Hors perimetre |
|---|---|---|---|---|---|---|
| Cercle 1 - Agences | 0 | 0 | 0 | 1 | 12 | 2 |
| Cercle 2 - TPE/PME/ETI | 0 | 0 | 0 | 0 | 2 | 0 |
| Cercle 3 - Centres de formation | 0 | 0 | 0 | 0 | 0 | 80 |

## 2. Repartition par departement

| Cercle | 83 (Var) | 13 (Bouches-du-Rhone) | Total |
|---|---|---|---|
| Cercle 1 - Agences | 15 | 218 | 233 |
| Cercle 2 - TPE/PME/ETI | 3 | 14 | 17 |
| Cercle 3 - Centres de formation | 11 | 106 | 117 |
| **Total** | **29** | **338** | **367** |

Origine du departement retenu (Apollo n'exporte aucune colonne code postal) :

- code postal siege : 240 contacts
- ville du contact : 127 contacts

## 3. Repartition par sous-segment - cercle 2

| Sous-segment | Libelle | Contacts |
|---|---|---|
| 2a | Services B2B a fort panier | 1 |
| 2e | Tech / SaaS / scale-ups | 16 |

Origine de la classification des 17 contacts retenus : industrie = 17.

L'industrie Apollo prime ; les mots-cles ne servent de repli que si l'industrie n'est pas mappee. **L'export ne couvre que le sous-segment 2e** (tech/SaaS/ESN) : 2b (hotellerie/tourisme), 2c (immobilier) et 2d (sante/bien-etre) sont absents et demandent de nouveaux scrapes Apollo. Le classifieur est deja pret a les router.

## 4. Top 10 des industries par cercle

### Cercle 1 - Agences

| Industrie | Contacts | Part |
|---|---|---|
| marketing & advertising | 127 | 54.5 % |
| media production | 30 | 12.9 % |
| public relations & communications | 21 | 9.0 % |
| graphic design | 18 | 7.7 % |
| design | 18 | 7.7 % |
| information technology & services | 8 | 3.4 % |
| online media | 3 | 1.3 % |
| retail | 2 | 0.9 % |
| management consulting | 2 | 0.9 % |
| real estate | 2 | 0.9 % |

### Cercle 2 - TPE/PME/ETI

| Industrie | Contacts | Part |
|---|---|---|
| information technology & services | 16 | 94.1 % |
| international trade & development | 1 | 5.9 % |

### Cercle 3 - Centres de formation

| Industrie | Contacts | Part |
|---|---|---|
| professional training & coaching | 71 | 60.7 % |
| higher education | 32 | 27.4 % |
| e-learning | 9 | 7.7 % |
| education management | 3 | 2.6 % |
| environmental services | 1 | 0.9 % |
| online media | 1 | 0.9 % |

## 5. Doublons supprimes

| Cercle | Doublons email | Doublons entreprise | Entreprises avec 2+ contacts conserves |
|---|---|---|---|
| Cercle 1 - Agences | 1 | 12 | 55 |
| Cercle 2 - TPE/PME/ETI | 0 | 2 | 4 |
| Cercle 3 - Centres de formation | 0 | 0 | 0 |

Regle entreprise : un seul contact par entreprise **et par bucket de fonction**. Un Founder et une Directrice marketing de la meme structure sont conserves tous les deux ; deux Account Managers de la meme structure non.

## 6. Couverture telephone

| Cercle | Avec telephone | Sans telephone | Taux de couverture |
|---|---|---|---|
| Cercle 1 - Agences | 130 | 103 | 55.8 % |
| Cercle 2 - TPE/PME/ETI | 12 | 5 | 70.6 % |
| Cercle 3 - Centres de formation | 59 | 58 | 50.4 % |
| **Total** | **201** | **166** | **54.8 %** |

## 7. Alertes

### 7.1 Colonnes attendues absentes de l'export Apollo

- **Aucune colonne code postal.** Le CP est noye en fin de `Company Address` (`..., Marseille, Provence-Alpes-Cote d'Azur, France, 13001`) et correspond au **siege social**, pas au contact. `postal_code` est donc extrait par expression reguliere ; il reste vide quand l'adresse Apollo n'en contient pas.
- **`Work Direct Phone`, `Mobile Phone`, `Home Phone` et `Other Phone` sont vides a 100 %** dans les trois fichiers. La seule source telephone exploitable est `Corporate Phone` (identique a `Company Phone`), c'est-a-dire le **standard de l'entreprise** : aucune ligne directe.
- **Aucune colonne de sous-segment 2a-2e** dans l'export du cercle 2 ; les valeurs sont derivees par le classifieur industrie + mots-cles documente en section 3.

### 7.2 Telephones ecartes

| Cercle | Contacts source concernes | Indicatif etranger | Autre format invalide |
|---|---|---|---|
| Cercle 1 - Agences | 44 | 38 | 6 |
| Cercle 2 - TPE/PME/ETI | 4 | 4 | 0 |
| Cercle 3 - Centres de formation | 34 | 32 | 2 |
| **Total** | **82** | | |

82 numeros (comptes sur les fichiers source, avant filtrage) ont ete vides plutot que renseignes corrompus. Repartition des indicatifs etrangers : +1 (41), +34 (5), +90 (3), +41 (2), +45 (2), +359 (2), +39 (2), +49 (2), +31 (2), +55 (2).

Exemples :

- `+1 705-230-8831` -> indicatif etranger +1
- `+1 779-774-3188` -> indicatif etranger +1
- `+41 43 499 10 10` -> indicatif etranger +41
- `+49 89 120840988` -> indicatif etranger +49
- `+55 11 98615-0061` -> indicatif etranger +55
- `+1 646-982-0882` -> indicatif etranger +1
- `+41 71 370 07 65` -> indicatif etranger +41
- `02885231313` -> longueur invalide (10 chiffres)
- `+7 495 663-31-07` -> indicatif etranger +7

Il s'agit de standards d'entreprise a indicatif etranger (+1, +49, +55, +41) attribues par Apollo a des structures pourtant locales : la donnee est fausse, pas seulement mal formatee. Les conserver aurait pollue la base de phoning.

### 7.3 Contacts incomplets

| Cercle | Sans LinkedIn | Sans site web | Sans code postal | dont CP siege neutralise | Sans effectif |
|---|---|---|---|---|---|
| Cercle 1 - Agences | 0 | 4 | 55 | 2 | 0 |
| Cercle 2 - TPE/PME/ETI | 0 | 0 | 15 | 15 | 0 |
| Cercle 3 - Centres de formation | 0 | 0 | 57 | 31 | 0 |

`postal_code` est vide dans deux cas : l'adresse Apollo du siege ne contenait aucun code postal, ou ce CP designait une commune hors du departement retenu (siege a Paris, contact a Marseille) et a ete neutralise pour ne pas produire de ligne contradictoire du type `postal_code=75016 / department=13`.

### 7.4 Emails a surveiller

- Emails generiques conserves (domaine unique dans le fichier) : **0**.
- Emails generiques supprimes : **0**.
- `Email Status` vaut `Verified` sur 100 % des lignes des trois exports : aucune ligne ecartee par ce filtre.
- Domaines **catch-all** (verification Apollo moins fiable, risque de bounce accru) : Cercle 1 - Agences : 33 ; Cercle 2 - TPE/PME/ETI : 2 ; Cercle 3 - Centres de formation : 33. A envoyer en fin de sequence ou a re-verifier avant envoi.

### 7.5 Contacts valides hors perimetre 83/13

**82 contacts** passent tous les filtres qualite mais sortent du perimetre 83/13. Ils sont conserves dans `hors-perimetre.csv` plutot que supprimes.

| Departement | Contacts |
|---|---|
| 06 | 52 |
| 84 | 9 |
| 75 | 9 |
| 04 | 4 |
| inconnu | 1 |
| 30 | 1 |
| 40 | 1 |
| 01 | 1 |
| 94 | 1 |
| 69 | 1 |
| 44 | 1 |
| 74 | 1 |

Le plus gros gisement est le **06** (Nice, Cannes, Antibes, Valbonne), concentre sur le cercle 3 : a activer si le perimetre est elargi (`--departements 83,13,06`).

## 8. Fichiers produits

| Fichier | Contenu | Lignes |
|---|---|---|
| `cercle1-agences-clean.csv` | Cercle 1 - Agences | 233 |
| `cercle2-tpe-pme-eti-clean.csv` | Cercle 2 - TPE/PME/ETI | 17 |
| `cercle3-formation-clean.csv` | Cercle 3 - Centres de formation | 117 |
| `all-contacts-clean.csv` | Les 3 cercles fusionnes | 367 |
| `hors-perimetre.csv` | Contacts valides hors 83/13 | 82 |

Format : UTF-8 sans BOM, separateur virgule, guillemets minimaux (`csv.QUOTE_MINIMAL`), colonnes dans l'ordre : `first_name, last_name, email, phone, company, job_title, linkedin_url, website, city, postal_code, department, employee_count, industry, cercle`.
