# Audit du decoupage en 7 campagnes

Source : `output/all-contacts-clean.csv` (367 contacts, departements 83 et 13).

## 1. Volumes par campagne

| Campagne | Cercle | Contacts | Persona cible | Hors persona | Statut |
|---|---|---|---|---|---|
| AZURPOD - AGENCES | 1 | 233 | 214 | 19 | prete |
| AZURPOD - CONSEIL/AUDIT | 2a | 1 | 1 | 0 | volume insuffisant (1 cible) |
| AZURPOD - HOTELLERIE/RESTAURATION | 2b | 0 | 0 | 0 | **VIDE - non lancable** |
| AZURPOD - IMMOBILIER RESIDENTIEL | 2c | 0 | 0 | 0 | **VIDE - non lancable** |
| AZURPOD - SANTE/ESTHETIQUE | 2d | 0 | 0 | 0 | **VIDE - non lancable** |
| AZURPOD - TECH | 2e | 16 | 7 | 9 | volume insuffisant (7 cibles) |
| AZURPOD - CENTRES DE FORMATION | 3 | 117 | 116 | 1 | prete |
| **Total** | | **367** | **338** | **29** | |

Une campagne est dite *prete* a partir de 10 contacts au persona cible : en dessous, le volume ne permet pas de mesurer un taux de reponse exploitable.

## 2. Campagnes non lancables en l'etat

**3 des 7 campagnes sont vides** : AZURPOD - HOTELLERIE/RESTAURATION, AZURPOD - IMMOBILIER RESIDENTIEL, AZURPOD - SANTE/ESTHETIQUE.

Ce n'est pas un defaut de decoupage : l'export Apollo du cercle 2 ne contient que 19 lignes, toutes en tech/SaaS/ESN. J'ai cherche des leads rattachables a ces segments dans les trois fichiers source, par industrie Apollo et par mots-cles sectoriels :

| Segment cherche | Lignes source touchees | Verdict |
|---|---|---|
| 2b hotellerie / tourisme / restauration | 47 | **aucun lead reel** : ce sont des agences dont les *clients* sont dans le tourisme (SUNMADE, RESOsign, le buro) |
| 2c immobilier residentiel | 40 | **aucun lead reel** : agences de com immobiliere et un cabinet d'architecture (RUBIKLE) |
| 2d sante / esthetique / bien-etre | 22 | **aucun lead reel** : organismes de formation specialises sante (Idelia Sante, FB Formation, Kendreka) |

Ces trois campagnes demandent de **nouveaux scrapes Apollo**. Le classifieur 2a-2e de `clean_leads.py` est deja pret a les router : filtrer Apollo sur les industries `hospitality`, `restaurants`, `leisure, travel & tourism` (2b), `real estate`, `commercial real estate` (2c), `hospital & health care`, `health, wellness & fitness`, `medical practice`, `cosmetics` (2d), en departements 83 et 13.

## 3. Adequation persona, campagne par campagne

Personas retenus, d'apres le brief de segmentation :

- **Cercle 1** : dirigeants et directeurs, direction de creation, de production, de contenu, marketing et communication.
- **Cercle 2 (2a-2e)** : marketing et communication, plus les dirigeants.
- **Cercle 3** : dirigeants, fonctions pedagogiques, marketing et communication.

### AZURPOD - AGENCES

| Fonction | Contacts | Persona |
|---|---|---|
| direction | 137 | cible |
| direction_generique | 38 | cible |
| creation | 25 | cible |
| marketing_comm | 12 | cible |
| tech | 8 | **hors cible** |
| operations | 5 | **hors cible** |
| commercial | 5 | **hors cible** |
| production | 2 | cible |
| pedagogie | 1 | **hors cible** |

Hors persona (19) : Directeur Méthodes et Process (Adrexo), Directeur Data (Adrexo), Directeur Technique et des Opérations (Appstronaute), Directrice des Projets (Artkom), Directeur des Systèmes D’information. Accréditations, Accueil du Public, Billetterie. (FIDMarseille, Festival International de Cinéma), Directrice Data Science (HOPPS GROUP), Technical Director (IDP360°), Directeur Pôle Innovation (Infostrates), International Sales Director (J.F. REY), Directeur de Grands Comptes (M COM), Director of Operations (MARS Marketing), Business Development Director (Marsatwork).

### AZURPOD - CONSEIL/AUDIT

| Fonction | Contacts | Persona |
|---|---|---|
| direction_generique | 1 | cible |

### AZURPOD - TECH

| Fonction | Contacts | Persona |
|---|---|---|
| commercial | 5 | **hors cible** |
| direction | 4 | cible |
| direction_generique | 2 | cible |
| operations | 2 | **hors cible** |
| marketing_comm | 1 | cible |
| tech | 1 | **hors cible** |
| rh | 1 | **hors cible** |

Hors persona (9) : Payroll Manager (ACD), Senior Engineering Manager (Boond), Key Account Manager (CITECH), Account Manager (Holidu), Territory Manager (INCEPTO), Recruitment Manager (Ippon Technologies), Account Manager Senior (Opteamis), Regional Operation Manager (VISEO), Executive Account Manager (Witivio - AI Solutions for Microsoft 365).

### AZURPOD - CENTRES DE FORMATION

| Fonction | Contacts | Persona |
|---|---|---|
| pedagogie | 47 | cible |
| direction | 39 | cible |
| marketing_comm | 29 | cible |
| direction_generique | 1 | cible |
| creation | 1 | **hors cible** |

Hors persona (1) : Concepteur E-learning / Responsable de la Communication (AECD Association pour l'éducation cognitive et le développement).

## 4. Alertes qualite

### 4.1 Cercle 1 : structures hors cible 2-30 personnes

**32 agences sur 233 depassent 30 salaries**, dont 9 au-dela de 100. Le brief vise des structures de 2 a 30 personnes : au-dela, le cycle de decision s'allonge et le pitch "une agence convertie = 5 a 20 sessions/an" ne porte plus de la meme facon.

| Entreprise | Poste | Effectif |
|---|---|---|
| Adrexo | Directeur Data | 11000 |
| Adrexo | Directeur Méthodes et Process | 11000 |
| La Briqueterie | Co-Founder & Product Strategist | 530 |
| HighCo Group | President | 450 |
| HighCo Group | Strategy & Innovation Director | 450 |
| Milee | President | 350 |
| Ekstend Group | Directrice - Strategy & Insights | 240 |
| Ekstend Group | Directrice de la Création | 240 |
| Marseille | Director IT at Water Group | 120 |
| MARS Marketing | Director of Operations | 70 |

A traiter comme un segment a part ou a exclure du premier envoi.

### 4.2 Contacts d'industrie incoherente avec leur campagne

- `Listen Leon` (Aix-en-Provence, 17 salaries) est dans **CENTRES DE FORMATION** mais son industrie Apollo est `online media` et ses mots-cles pointent une app de soft skills, pas un organisme de formation. A verifier manuellement.
- `REFORM` (Marseille, 8 salaries), industrie `environmental services`, a bien `formation` et `conseil` dans ses mots-cles : maintien en cercle 3 justifie.
- **1 ligne(s) Apollo corrompue(s)**, a supprimer manuellement avant import :
  - `Marseille` / `Director IT at Water Group` (AZURPOD - AGENCES, 120 salaries, aucun site web) : le nom d'entreprise est un nom de ville ou l'intitule designe une autre societe.
- 14 contacts du cercle 1 portent une industrie Apollo non creative (`information technology & services`, `management consulting`, `retail`). Verification faite : ce sont bien des agences (Simplement - Agence Web Marseille, Studio3615, Sylab Films). Le label Apollo est imprecis, pas la segmentation.

### 4.3 Faux `hors_cible` reperes a la relecture

Le classement `persona_fit` repose sur l'intitule de poste ; deux intitules mixtes tombent du mauvais cote et doivent etre repasses en `cible` :

- `Directrice des Operations Communication et Formation` (Sacres Francais, AGENCES) : classee *pedagogie* a cause du mot "Formation", alors que c'est une fonction communication d'agence.
- `Concepteur E-learning / Responsable de la Communication` (AECD, CENTRES DE FORMATION) : classee *creation* a cause de "Concepteur", alors que la seconde moitie de l'intitule est bien une fonction communication.

Les 27 autres `hors_cible` sont des exclusions justifiees (commerciaux, RH, DSI, direction des operations).

### 4.4 Doublons inter-campagnes

- Emails presents dans plusieurs campagnes : **0**.
- Entreprises presentes dans plusieurs campagnes : **0**.

Un contact n'appartient qu'a une seule campagne : aucun risque de double envoi.

### 4.5 Entreprises avec plusieurs contacts dans la meme campagne

| Campagne | Entreprises concernees | Contacts cumules |
|---|---|---|
| AZURPOD - AGENCES | 27 | 55 |
| AZURPOD - CONSEIL/AUDIT | 0 | 0 |
| AZURPOD - TECH | 2 | 4 |
| AZURPOD - CENTRES DE FORMATION | 0 | 0 |

Ces contacts ont des fonctions distinctes (un dirigeant et une responsable marketing, par exemple). Espacer leurs envois de quelques jours pour eviter que deux mails Azurpod n'arrivent le meme jour dans la meme entreprise.

## 5. Couverture des donnees par campagne

| Campagne | Contacts | Avec telephone | Avec LinkedIn | Avec site | 83 | 13 |
|---|---|---|---|---|---|---|
| AZURPOD - AGENCES | 233 | 130 | 233 | 229 | 15 | 218 |
| AZURPOD - CONSEIL/AUDIT | 1 | 0 | 1 | 1 | 0 | 1 |
| AZURPOD - HOTELLERIE/RESTAURATION | 0 | - | - | - | - | - |
| AZURPOD - IMMOBILIER RESIDENTIEL | 0 | - | - | - | - | - |
| AZURPOD - SANTE/ESTHETIQUE | 0 | - | - | - | - | - |
| AZURPOD - TECH | 16 | 12 | 16 | 16 | 3 | 13 |
| AZURPOD - CENTRES DE FORMATION | 117 | 59 | 117 | 117 | 11 | 106 |

## 6. Fichiers produits

| Fichier | Campagne | Lignes |
|---|---|---|
| `azurpod-agences-cercle1.csv` | AZURPOD - AGENCES | 233 |
| `azurpod-conseil-audit-cercle2a.csv` | AZURPOD - CONSEIL/AUDIT | 1 |
| `azurpod-hotellerie-restauration-cercle2b.csv` | AZURPOD - HOTELLERIE/RESTAURATION | 0 |
| `azurpod-immobilier-residentiel-cercle2c.csv` | AZURPOD - IMMOBILIER RESIDENTIEL | 0 |
| `azurpod-sante-esthetique-cercle2d.csv` | AZURPOD - SANTE/ESTHETIQUE | 0 |
| `azurpod-tech-cercle2e.csv` | AZURPOD - TECH | 16 |
| `azurpod-centres-formation-cercle3.csv` | AZURPOD - CENTRES DE FORMATION | 117 |

Colonnes : `first_name, last_name, email, phone, company, job_title, linkedin_url, website, city, postal_code, department, employee_count, industry, cercle, campaign, persona_fit`.

`campaign` reprend le nom exact de la campagne, pour retrouver la segmentation apres import ou fusion. `persona_fit` vaut `cible` ou `hors_cible` : filtrer sur `cible` pour le premier envoi, garder les `hors_cible` pour une relance a part.

Format : UTF-8 sans BOM, separateur virgule, `csv.QUOTE_MINIMAL`, fins de ligne LF.