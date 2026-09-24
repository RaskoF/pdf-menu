# Bilan SEO Vilber — avril → septembre 2026

Chaîne d'extraction, d'analyse et de restitution pour le bilan d'accompagnement
**Studio Visuweb × Vilber**.

> **À lire avant de produire le moindre chiffre client :
> [`docs/ECARTS-BRIEF.md`](docs/ECARTS-BRIEF.md).**
> Plusieurs valeurs de référence du brief d'analyse ne correspondent pas aux
> sources Notion (périodes T1, baseline impressions, définition du % branded,
> canal de conversion). Tant que ces points ne sont pas arbitrés, un bilan
> produit à partir du brief seul serait faux.

---

## Périodes

| Clé | Fenêtre | Jours | Rôle |
|---|---|---|---|
| `T0` | 20/03 → 19/04/2026 | 31 | baseline, mois précédant le kick-off |
| `T1` | 20/04 → 05/07/2026 | 77 | phase 1 (M1-M2) |
| `T2` | 05/07 → 20/09/2026 | 78 | phase 2 (M3) — à mesurer |
| `GLOBAL` | 20/04 → 20/09/2026 | 154 | bilan consolidé |
| `R1_COURANT` | 26/05 → 24/06/2026 | 30 | période **réelle** du rapport #1 |
| `R1_COMPARAISON` | 26/03 → 25/05/2026 | 61 | comparaison du rapport #1 |
| `T2_N1` | 05/07 → 20/09/2025 | 78 | contrôle de saisonnalité (creux d'août) |
| `T1_N1` | 20/04 → 05/07/2025 | 77 | contrôle de saisonnalité |

Les périodes n'ont pas la même longueur : **toute comparaison passe par les
métriques normalisées « par 30 jours »** produites par `consolidate.py`. Comparer
les totaux bruts de T0 et T2 donnerait une fausse progression d'un facteur ~2,5.

`R1_COURANT` et `R1_COMPARAISON` servent à vérifier que nos extractions
retrouvent bien les chiffres déjà présentés à Anaïs en juillet.

---

## Installation

```bash
cd vilber-bilan-3m
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # puis renseigner les credentials
set -a && source .env && set +a
```

---

## Reproduire le bilan

```bash
python scripts/extract_search_console.py      # GSC — toutes les périodes
python scripts/extract_ga4.py                 # GA4
python scripts/extract_semrush.py             # SEMrush API…
python scripts/extract_semrush.py --from-csv  # …ou exports manuels
python scripts/extract_clarity.py             # exports CSV Clarity
python scripts/extract_webflow.py             # formulaires Webflow
python scripts/consolidate.py                 # -> data/consolidated/
jupyter lab notebooks/analysis.ipynb          # analyse + figures
```

Chaque script est indépendant et **met en cache** ses réponses dans
`data/raw/<source>/<période>__<dataset>.json`. Une relance ne re-quérie pas ce
qui est déjà là ; `--refresh` force le rappel de l'API.

`consolidate.py` **ne plante pas** sur une source absente : il la note dans
`data/consolidated/manifest.json` et poursuit. Le lancer à tout moment donne donc
l'état des lieux de ce qui reste à collecter.

```bash
python scripts/consolidate.py
cat data/consolidated/manifest.json | python3 -m json.tool | head -20
```

### Tester la chaîne sans credentials

```bash
python scripts/make_fixtures.py                              # données FICTIVES
DATA_RAW_OVERRIDE=data/raw_fixtures python scripts/consolidate.py
```

Les fixtures portent `"fixture": true` dans leur méta. Elles servent à vérifier
que le pipeline et le notebook tournent — **aucun de leurs chiffres ne doit
sortir d'ici**.

---

## Arborescence

```
vilber-bilan-3m/
├── data/
│   ├── raw/              exports API bruts, horodatés (git-ignorés)
│   ├── consolidated/     tables exploitables (CSV) + bilan.json + manifest.json
│   └── reference/        valeurs relevées dans Notion (versionnées)
├── scripts/
│   ├── config.py                 périodes, regex branded, money pages, clusters, articles
│   ├── common.py                 cache, classification, normalisation 30 j
│   ├── viz.py                    palette et style des figures
│   ├── extract_search_console.py
│   ├── extract_ga4.py
│   ├── extract_semrush.py
│   ├── extract_clarity.py
│   ├── extract_webflow.py
│   ├── consolidate.py
│   └── make_fixtures.py          données fictives pour tester la chaîne
├── notebooks/analysis.ipynb
├── report/
│   ├── rapport-vilber-bilan-3m.md    trame du rapport client
│   └── figures/                      graphiques générés
└── docs/ECARTS-BRIEF.md              écarts brief ↔ sources Notion
```

---

## Ce qui reste à fournir

| Élément | Statut | Notes |
|---|---|---|
| Credentials Google Search Console | ⬜ | OAuth ou compte de service |
| Credentials GA4 | ⬜ | compte de service + `GA4_PROPERTY_ID` |
| Clé API SEMrush | ⬜ | sinon exports CSV manuels |
| Exports Clarity T0 et T1 | ⬜ | **non ré-extractibles** : l'API ne couvre que 3 jours |
| Token Webflow **de l'espace Vilber** | ⬜ | le site Vilber de notre espace est une copie de dev, 0 soumission |
| Valeur d'un lead | ⬜ | à valider par Anaïs avant tout calcul de ROI |
| Dates de mise en ligne des optims M1/M2 | ⬜ | `config.OPTIMISATIONS` — sans elles, pas d'attribution possible |
| Arbitrage des 9 écarts du brief | ⬜ | `docs/ECARTS-BRIEF.md` |
| Accès Notion « KPIs & Objectifs » | ✅ | valeurs relevées dans `data/reference/kpis_notion.json` |
| Rapport #1 de juillet | ✅ | valeurs relevées dans `data/reference/rapport1.json` |

---

## Conventions

- Dates **ISO 8601** (`2026-04-20`), fuseau **Europe/Paris**.
- Les volumes comparés sont **normalisés par 30 jours**.
- Deux définitions de « branded » sont calculées partout — **stricte**
  (`vilber`/`lourmat`) et **large** (marque + gammes). Le rapport doit nommer
  celle qu'il cite.
- Les figures suivent une palette catégorielle à ordre fixe, validée pour le
  daltonisme (`scripts/viz.py`). Jamais de double axe Y : deux échelles sur un
  même cadre font lire des croisements qui n'existent pas.
