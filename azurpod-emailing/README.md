# Azurpod — nettoyage des exports Apollo (cold emailing)

Nettoyage des 3 scrapes Apollo pour la campagne cold emailing Azurpod
(studio de podcast et création de contenus, Toulon).

## Lancer

```bash
cd azurpod-emailing
python3 clean_leads.py                     # nettoyage, périmètre 83 + 13 (défaut)
python3 clean_leads.py --departements 83,13,06   # élargi aux Alpes-Maritimes
python3 split_campaigns.py                 # découpe en 7 campagnes
```

`split_campaigns.py` lit `output/all-contacts-clean.csv` : relancer `clean_leads.py`
d'abord si les sources changent. Dépendance : `pandas`.

## Arborescence

| Chemin | Contenu |
|---|---|
| `source/` | exports Apollo bruts (73 colonnes) |
| `clean_leads.py` | script de nettoyage |
| `output/cercle1-agences-clean.csv` | cercle 1 — agences |
| `output/cercle2-tpe-pme-eti-clean.csv` | cercle 2 — TPE/PME/ETI, sous-segments 2a-2e |
| `output/cercle3-formation-clean.csv` | cercle 3 — centres de formation |
| `output/all-contacts-clean.csv` | les 3 cercles fusionnés |
| `output/hors-perimetre.csv` | contacts valides hors 83/13 (06, 84, 75…) |
| `output/recap.md` | rapport de nettoyage complet |
| `campaigns/azurpod-*.csv` | les 7 campagnes prêtes à importer |
| `campaigns/azurpod-agences-formations.csv` | **fusion agences + formations, 350 contacts** |
| `campaigns/audit-campagnes.md` | audit du découpage (volumes, personas, alertes) |

## Les 7 campagnes

| Campagne | Cercle | Contacts | Persona cible |
|---|---|---|---|
| AZURPOD - AGENCES | 1 | 233 | 214 |
| AZURPOD - CONSEIL/AUDIT | 2a | 1 | 1 |
| AZURPOD - HOTELLERIE/RESTAURATION | 2b | **0** | 0 |
| AZURPOD - IMMOBILIER RESIDENTIEL | 2c | **0** | 0 |
| AZURPOD - SANTE/ESTHETIQUE | 2d | **0** | 0 |
| AZURPOD - TECH | 2e | 16 | 7 |
| AZURPOD - CENTRES DE FORMATION | 3 | 117 | 116 |

### Périmètre retenu pour le premier envoi

Agences + centres de formation uniquement, en 83 et 13 :
`campaigns/azurpod-agences-formations.csv`, **350 contacts / 350 emails uniques /
322 entreprises**, dont 332 au persona cible, 189 avec téléphone et 350 avec
LinkedIn. La colonne `campaign` permet de rescinder le fichier : utiliser les
deux CSV de campagne pour l'envoi (mesure par audience), le fichier fusionné
pour un import unique en CRM.

Les fichiers des campagnes portent deux colonnes de plus que les CSV nettoyés :
`campaign` (nom exact de la campagne) et `persona_fit` (`cible` / `hors_cible`).
Filtrer sur `cible` pour le premier envoi.

**2b, 2c et 2d sont vides** : le scrape Apollo du cercle 2 ne couvre que la tech.
Voir `campaigns/audit-campagnes.md` § 2 pour les filtres Apollo à utiliser.

## Schéma de sortie

`first_name, last_name, email, phone, company, job_title, linkedin_url, website,
city, postal_code, department, employee_count, industry, cercle`

UTF-8 sans BOM, séparateur virgule, `csv.QUOTE_MINIMAL`, fins de ligne LF.
Prêt à charger dans Instantly / Lemlist / Smartlead.

## Décisions de nettoyage

- **`postal_code`** : Apollo n'exporte aucune colonne code postal. Il est extrait
  de la fin de `Company Address`, et correspond au **siège social**.
- **`department`** : CP du siège s'il est dans le périmètre, sinon département
  déduit de la ville du contact (mapping des 54 communes présentes). Un CP de
  siège incohérent avec le département retenu est neutralisé plutôt qu'affiché.
- **`phone`** : aucune ligne directe ni portable dans l'export (`Work Direct
  Phone`, `Mobile Phone`, `Home Phone` vides à 100 %). Seul `Corporate Phone`
  (le standard) est exploitable, normalisé en `+33XXXXXXXXX` ; les 82 numéros à
  indicatif étranger sont vidés.
- **Dédup entreprise** : un contact par entreprise **et par bucket de fonction**.
  Les buckets sont évalués du plus spécifique au plus générique : marqueurs de
  direction explicites (founder, CEO, gérant…), puis fonctions métier
  (pédagogie, création, production, marketing/comm, commercial, RH, tech,
  opérations), puis direction générique (`Director`, `Directrice`,
  `Responsable`, `Head of` sans fonction identifiable). Un Founder *et* une
  Directrice marketing de la même structure sont donc tous deux conservés.
- **`cercle`** : `1` / `3` en dur, `2a`-`2e` classifiés par industrie Apollo puis
  mots-clés. L'export du cercle 2 ne couvre que le 2e.

Voir `output/recap.md` pour les volumes, les répartitions et les alertes.
