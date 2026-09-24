# Bilan SEO Vilber × Studio Visuweb — avril → septembre 2026

> **État : trame. Les chiffres marqués `⟨…⟩` sont à remplir depuis
> `data/consolidated/` une fois l'extraction lancée.**
> Ne rien envoyer à Anaïs avant d'avoir tranché les points de
> [`docs/ECARTS-BRIEF.md`](../docs/ECARTS-BRIEF.md).

| | |
|---|---|
| **Client** | Vilber — imagerie scientifique (Western blot, In Vivo, UV, gel doc) |
| **Site** | vilber.com (Webflow) |
| **Contact** | Anaïs Fourt, marketing |
| **Démarrage** | 20 avril 2026 |
| **Période couverte** | 20 avril → 20 septembre 2026 (5 mois) |
| **Rapport précédent** | « Rapport #1 », période 26/05 → 24/06/2026 |

---

## 1. Executive summary

⟨5 à 10 lignes. Structure attendue :
ce qui a progressé · ce qui n'a pas bougé · ce qui a reculé et pourquoi ·
la recommandation de reconduction, en une phrase.⟩

Trois avertissements méthodologiques à garder dans le résumé, parce qu'ils
changent la lecture de tous les chiffres qui suivent :

1. **Les périodes n'ont pas la même longueur** (T0 : 31 j, T1 : 77 j, T2 : 78 j).
   Tous les volumes cités ici sont **normalisés par 30 jours**.
2. **T2 contient août**, creux académique en sciences de la vie ; T1 non. La
   comparaison honnête est T2 contre la même fenêtre un an plus tôt (`T2_N1`),
   pas T1 → T2 brut.
3. **Les articles M3 ont été publiés en juillet-août.** Leur plein effet SEO
   n'arrivera qu'en novembre. Ce bilan mesure leur démarrage, pas leur résultat.

---

## 2. Tableau comparatif T0 / T1 / T2

*(généré par le notebook — cellule « Export des tableaux », fichier
`report/tableaux-generes.md`)*

| KPI | T0 (baseline) | T1 | T2 | Cible Q2 | Δ T0→T2 |
|---|---|---|---|---|---|
| Clics organiques / 30 j | 1 817 | ⟨…⟩ | ⟨…⟩ | 3 600-3 800 | ⟨…⟩ |
| Impressions / 30 j | 26 417 ⚠️ | ⟨…⟩ | ⟨…⟩ | 32 000 | ⟨…⟩ |
| CTR moyen | 6,9 % | ⟨…⟩ | ⟨…⟩ | 8,5 % | ⟨…⟩ |
| Position moyenne | 16,3 | ⟨…⟩ | ⟨…⟩ | 12 | ⟨…⟩ |
| Mots-clés positionnés | 64 ⚠️ | ⟨…⟩ | ⟨…⟩ | 100 | ⟨…⟩ |
| Mots-clés top 10 | ~10 | ⟨…⟩ | ⟨…⟩ | 20 | ⟨…⟩ |
| Mots-clés top 3 | 0 | ⟨…⟩ | ⟨…⟩ | 3-5 | ⟨…⟩ |
| Sessions organic / 30 j | 1 860 | ⟨…⟩ | ⟨…⟩ | 2 600-2 900 | ⟨…⟩ |
| Durée d'engagement / session | ⟨…⟩ | 83 s | ⟨…⟩ | — | ⟨…⟩ |
| Scroll depth Clarity | ⟨à retrouver⟩ | 54,91 % | ⟨…⟩ | — | ⟨…⟩ |
| **% clics marque (strict)** | **27,2 %** | ⟨…⟩ | ⟨…⟩ | **24 %** | ⟨…⟩ |
| **% clics marque (large)** | **70 %** | ⟨…⟩ | ⟨…⟩ | **55-60 %** | ⟨…⟩ |

⚠️ = valeur divergente du brief, cf. `docs/ECARTS-BRIEF.md` § 2.

**Les deux lignes « % clics marque » ne se contredisent pas** : la première ne
compte que `vilber`/`vilber lourmat`, la seconde y ajoute les noms de gammes
(`fusion`, `newton`, `e-box`…). Il faut en choisir une pour la présentation
client et s'y tenir.

![Séries mensuelles](figures/01-series-mensuelles.png)
![KPIs par période](figures/02-kpis-par-periode.png)

---

## 3. Part des requêtes de marque — le vrai indicateur de fond

![Marque vs non-marque](figures/03-branded-vs-non-branded.png)

⟨Lecture attendue : une baisse de la part de marque, même à volume de clics
stable, signifie que le site capte des requêtes qu'il ne touchait pas — c'est
l'objectif structurant du trimestre. Une hausse de la part de marque à volume
croissant signifie qu'on profite de la notoriété sans gagner de terrain.⟩

Repère : au 20/07/2026, la base KPIs affichait 28,2 % (définition stricte) pour
une cible à 24 % — objectif alors **non atteint**.

---

## 4. Analyse par cluster

![Heatmap clusters](figures/05-heatmap-clusters.png)

### Western Blot — money page `/systems/fusion-absolute`
⟨…⟩
Repère du rapport #1 : **+26,5 % de clics** sur Fusion Absolute (291 vs 230),
position 5,4. C'est le cluster où le potentiel identifié est le plus large
(580 mots-clés où Bio-Rad ranke et Vilber non, beaucoup en KD < 30).

### UV Instruments — money pages `/uv-instrument/uv-*`
⟨…⟩
Repères du rapport #1 : `uv-lamps` +10,3 % ; `uv-tubes` **−25 %** (position
7,0 → 10,2) ; `uv-radiometers` passée de la position 4,9 à la position 1 sur
« uv radiometer » — mais position moyenne de page dégradée à 15,5, à expliquer.

### In Vivo — money page `/systems/newton`
⟨…⟩
Repère : −5,9 % de clics en juin, position 5,3. Le cluster NIR-II a en revanche
produit la traction la plus rapide jamais vue sur le site (1 183 impressions en
moins de 3 semaines sur « When to Use NIR-II Imaging »). Newton X-Ray : premières
ventes signées côté Vilber.

### Gel Doc — money page `/systems/e-box`
⟨…⟩
Repère : **−11,2 %** de clics en juin (206 vs 232) malgré la position améliorée
(5,2 → 4,7). À creuser : perte de requêtes, ou concurrence sur la SERP ?

---

## 5. Impact des optimisations techniques

| Chantier | Mois | Cible | Mise en ligne | Effet mesuré |
|---|---|---|---|---|
| Metadata E-Box | M1 | `/systems/e-box` | ⟨date⟩ | ⟨…⟩ |
| Schemas UV Instruments | M1 | `/uv-instrument/` | ⟨date⟩ | ⟨…⟩ |
| Schema Fusion Absolute | M2 | `/systems/fusion-absolute` | ⟨date⟩ | ⟨…⟩ |
| Meta UV Tubes | M2 | `/uv-instrument/uv-tubes` | ⟨date⟩ | ⟨…⟩ |
| Metas X-Ray | M2 | 3 articles X-Ray | ⟨date⟩ | ⟨…⟩ |

**Rich results** : les schemas implémentés en juillet-août mettent 2 à 6 semaines
à être pris en compte par Google. Ceux de fin août sont donc à peine indexés au
20/09. État Search Console au ⟨date⟩ : ⟨…⟩.

**Les dates de mise en ligne manquent** — sans elles, on ne peut pas attribuer une
variation à un chantier. À renseigner dans `scripts/config.py`,
liste `OPTIMISATIONS`.

---

## 6. Impact des articles publiés

![Impact articles](figures/06-impact-articles.png)

| Vague | Contenu | Publication | Statut au 20/09 |
|---|---|---|---|
| **M1** | 10 articles (pilier WB, cluster NIR-II, gel doc, biosafety) | juin 2026 | ⟨…⟩ |
| **M3** | WB Troubleshooting · WB Quantification (ImageJ + quantification absolue) · Guide UV Irradiation (Bio-Sun / Bio-Link) | juillet-août 2026 | ⟨…⟩ |
| **M3** | 3 articles X-Ray rédigés par le directeur Vilber, optimisés SEO par nos soins (metas, mots-clés, slugs, cross-linking) | juillet-août 2026 | ⟨…⟩ |

Ces trois derniers ne figurent pas dans le brief mais sont du travail livré : ils
doivent apparaître au bilan.

**Latence à rappeler au client** : un article publié en août n'a pas fini de se
positionner en septembre. Les articles M1 de juin, eux, ont maintenant 3 mois et
sont lisibles — c'est sur eux que se juge la mécanique éditoriale.

---

## 7. Leads et conversions

⟨…⟩

Trois points à ne pas rater :

- **Le formulaire de démo n'est pas le canal principal.** Au rapport #1 :
  41 `contact_submitted` contre 1 `demo_requested` sur 42 conversions. Compter
  les leads sur `/get-a-demo` seul diviserait le résultat par ~40.
- **83 % des conversions sont en source Direct**, 14 % en organique. Le SEO ne
  doit revendiquer que sa part — et c'est sa progression qui compte.
- **Volumes confirmés par Anaïs** (call du 10 juillet) : 42 demandes en juin,
  record mensuel, dont 28 pour des systèmes — Fusion Absolute 11, Gel Doc 8,
  Newton 6. Beaucoup de leads Allemagne.

**ROI** : ⟨à calculer une fois la valeur d'un lead validée par Anaïs. Tant qu'elle
n'est pas validée, ne pas publier de chiffre € — cf. `docs/ECARTS-BRIEF.md` § 7.⟩

---

## 8. Anomalies détectées

![Anomalies](figures/07-anomalies.png)

| Anomalie | Période | Statut | Effet sur la lecture |
|---|---|---|---|
| Trafic Direct « bot » | présent en T0, disparu en T1 | ⟨stable en T2 ?⟩ | ⟨…⟩ |
| Pics / creux quotidiens GSC | ⟨…⟩ | ⟨…⟩ | ⟨…⟩ |
| Creux d'août | T2 | attendu | comparer à `T2_N1`, pas à T1 |
| Dead clicks 8,03 % | rapport #1 | ⟨évolution ?⟩ | friction directe sur les pages de conversion |

Le dead click rate à 8,03 % relevé en juin reste le signal UX le plus
préoccupant : un dead click toutes les 12 sessions, sur des pages comme Fusion
Absolute ou E-Box.

---

## 9. Positionnement concurrentiel

| Concurrent | Mots-clés communs | Mots-clés où ils rankent et pas Vilber | Écart d'autorité |
|---|---|---|---|
| Bio-Rad (ChemiDoc, Image Lab) | ⟨…⟩ | ⟨580 en Western Blot au dernier relevé⟩ | ⟨…⟩ |
| LI-COR (Odyssey) | ⟨…⟩ | ⟨…⟩ | ⟨…⟩ |
| Analytik Jena (UVP, ChemStudio) | ⟨…⟩ | ⟨…⟩ | ⟨…⟩ |
| Syngene (G:BOX) | ⟨…⟩ | ⟨…⟩ | ⟨…⟩ |
| Azure Biosystems | ⟨…⟩ | ⟨…⟩ | ⟨…⟩ |

---

## 10. Recommandations

### Reconduire ?
⟨Recommandation argumentée, appuyée sur le tableau § 2 et sur la trajectoire
marque/non-marque du § 3, pas sur le volume brut de clics.⟩

### Chantiers prioritaires pour le trimestre suivant
1. ⟨…⟩
2. ⟨…⟩
3. ⟨…⟩

### Pistes déjà identifiées et non encore traitées
- **Marché US** : 3 386 impressions sur 30 j pour seulement 50 clics (CTR 1,5 %,
  position 10,2), quand la France est à 19,6 % de CTR en position 3,7. Gagner
  3-4 positions sur 5 pages US est le levier au meilleur rapport effort/résultat
  identifié à ce jour.
- **Dead clicks à 8 %** sur les pages de conversion.
- **Hub `/ressources/publications` à 5,9 s de chargement** — il distribue tous
  les articles.
- **Erreurs JavaScript sur 20 % des sessions.**
- **Canal IA générative** : ChatGPT a généré 54 sessions et 1 conversion en juin.
  Faible en volume, mais c'est un canal à instrumenter avant les concurrents.

---

## Annexes

### A. Méthodologie
- **Sources** : Google Search Console (API), GA4 (Data API v1beta), SEMrush,
  Microsoft Clarity (exports manuels), Webflow Data API v2, Notion.
- **Fuseau** : Europe/Paris. **Dates** : ISO 8601.
- **Normalisation** : tous les volumes sont ramenés à 30 jours
  (`common.per_30_days`), les périodes étant de longueurs différentes.
- **Définition « branded »** : ⟨préciser laquelle est citée dans ce rapport⟩.
- **Reproduction** : voir `README.md`.

### B. Données brutes
- `data/raw/` — réponses API telles quelles, horodatées.
- `data/consolidated/` — tables exploitables (CSV) + `bilan.json`.
- `data/consolidated/manifest.json` — ce qui a été collecté, ce qui manque.

### C. Limites connues
- Clarity ne permet pas de reconstituer T0 et T1 par API (fenêtre de 3 jours).
- SEMrush ne fournit que des agrégats mensuels sur les plans standard : les
  périodes T0/T1/T2 y sont approximées par les mois qu'elles recouvrent.
- Les écarts entre le brief et les sources Notion sont listés dans
  `docs/ECARTS-BRIEF.md` et doivent être arbitrés avant diffusion.
