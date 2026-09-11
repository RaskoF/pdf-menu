# Azurpod — nettoyage des exports Apollo (cold emailing)

Nettoyage des 3 scrapes Apollo pour la campagne cold emailing Azurpod
(studio de podcast et création de contenus, Toulon).

## Lancer

```bash
python3 azurpod-emailing/clean_leads.py                       # périmètre 83 + 13 (défaut)
python3 azurpod-emailing/clean_leads.py --departements 83,13,06  # élargi aux Alpes-Maritimes
```

Dépendance : `pandas`.

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
- **Dédup entreprise** : un contact par entreprise **et par bucket de fonction**
  (direction, marketing/comm, pédagogie, création, production, commercial,
  opérations, tech, RH), pour garder un Founder *et* une Directrice marketing.
- **`cercle`** : `1` / `3` en dur, `2a`-`2e` classifiés par industrie Apollo puis
  mots-clés. L'export du cercle 2 ne couvre que le 2e.

Voir `output/recap.md` pour les volumes, les répartitions et les alertes.
