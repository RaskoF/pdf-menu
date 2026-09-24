# Écarts entre le brief d'analyse et les sources Vilber

**Relevé le 24/09/2026**, en confrontant le brief aux deux sources de vérité Notion :

- base **« Visuweb - SEO KPIs & Objectifs »** (`collection://34543143-fe4a-8070-9d97-000bece2f626`)
- page **« Rapport #1 »**, base « Rapports SEO — Mensuel »
  ([lien](https://app.notion.com/p/34543143fe4a8091911dc694949571e9))
- page **« Stratégie M3 V2 »**
  ([lien](https://app.notion.com/p/39f43143fe4a80bc90d7ea148e703854))

La majorité des valeurs de référence du brief ne se retrouvent pas dans ces
sources. Il faut trancher chaque point **avant** de rédiger le rapport client :
un bilan qui compare T2 à une baseline erronée transforme une progression en
régression, ou l'inverse.

Les scripts de ce dépôt utilisent les valeurs **Notion**, pas celles du brief.

---

## 1. Les périodes ne correspondent pas — point le plus lourd

| | Brief | Notion |
|---|---|---|
| T1 (rapport initial) | 20/04 → 05/07/2026 | **26/05 → 24/06/2026** (30 j) |
| Période de comparaison du rapport #1 | — | 26/03 → 25/05/2026 (61 j, ÷2) |
| Nombre de rapports en base | « rapport déjà produit et présenté » | **un seul** : « Rapport #1 » |

Conséquences :

- Il n'existe **aucun rapport couvrant 20/04 → 05/07**. Les « valeurs T1 exactes »
  que tu comptais me transmettre n'existent que pour la fenêtre 26/05 → 24/06.
- La fenêtre **25/06 → 04/07 n'est couverte par rien**.
- T0 selon le brief = « mars 2026 ». Le rapport #1 compare en fait à
  26/03 → 25/05, qui **chevauche les cinq premières semaines de mission**. Ce
  n'est pas une baseline pré-mission.

**À trancher** : soit on recalcule T1 sur 20/04 → 05/07 depuis la Search Console
(possible, l'API remonte 16 mois) et on assume que le chiffre présenté à Anaïs en
juillet ne sera pas celui du bilan ; soit on garde 26/05 → 24/06 comme référence
T1 et on le dit. Les deux se défendent, mais il faut choisir une fois.
`scripts/config.py` extrait **les deux** (`T1` et `R1_COURANT`) pour permettre
l'arbitrage sur pièces.

---

## 2. Les baselines chiffrées divergent

| KPI | Brief | Notion (base KPIs) | Écart |
|---|---|---|---|
| Clics organiques / mois | 1 817 | **1 817** | ✅ concordant |
| Impressions / mois | 12 835 | **26 417** | ×2,06 |
| Mots-clés positionnés | 58 | **64** | +10 % |
| CTR moyen | absent du brief | 6,9 % (cible 8,5 %) | — |
| Position moyenne | absent du brief | 16,3 (cible 12) | — |
| Sessions organic / mois | absent du brief | 1 860 | — |

Sur les impressions, l'écart est trop grand pour être un arrondi. Hypothèse la
plus probable : le brief cite un périmètre géographique restreint (France seule ?)
là où Notion cite le worldwide. **À confirmer avant publication** — avec 12 835 en
baseline, T2 affichera une progression spectaculaire et fausse.

---

## 3. « % branded » : deux définitions incompatibles, toutes deux présentes dans Notion

| Source | Définition | Baseline | Cible | Dernier résultat |
|---|---|---|---|---|
| Base KPIs Notion | `vilber` + `vilber lourmat` seuls | **27,2 %** | **24 %** | 28,2 % (non atteint) |
| Stratégie M3 + brief | marque **+ noms de gammes** | **70 %** | **55-60 %** | non mesuré |

Ce n'est pas une contradiction : ce sont deux mesures différentes du même
phénomène. `fusion absolute`, `newton 7.0`, `e-box` sont des requêtes de produit —
branded au sens large, non-branded au sens strict.

Le brief présente le « % branded » comme *le* KPI stratégique caché. Il faut donc
que le rapport **nomme la définition utilisée** à chaque fois qu'il cite le
chiffre, sinon la même réalité se raconte comme un succès (28 % → sous les 55-60 %
visés !) ou comme un échec (28,2 % contre 24 % visés).

`scripts/config.py` implémente les deux (`BRANDED_STRICT_PATTERNS`,
`BRANDED_LARGE_PATTERNS`) et le notebook affiche les deux côte à côte.

---

## 4. Les valeurs T1 du brief ne sont pas celles du rapport #1

| KPI | Brief (T1) | Rapport #1 (26/05 → 24/06) |
|---|---|---|
| Clics organiques / mois | 1 660 | **1 620** |
| Impressions / mois | 15 720 | **16 800** |
| Mots-clés positionnés | 88 | non mesuré dans le rapport #1 |
| CTR moyen | absent | 9,6 % |
| Position moyenne | absente | 7,0 |

Écarts faibles mais réels. Le rapport #1 reste la seule valeur opposable : c'est
lui qui a été présenté à Anaïs.

---

## 5. GA4 et Clarity : les ordres de grandeur ne collent pas

| KPI | Brief | Rapport #1 |
|---|---|---|
| Durée d'engagement GA4 | 33 s → 48 s | **~1 min 13 s → ~1 min 23 s** (73 → 83 s) |
| Scroll depth Clarity | 47,7 % → 63,4 % | **54,91 %**, sans comparaison disponible |

Le facteur ~1,7 sur la durée d'engagement suggère deux métriques différentes
(`averageSessionDuration` vs `userEngagementDuration/sessions`). Le script GA4
extrait les deux pour lever le doute.

Sur le scroll depth, la cible « 70 % + » du brief part d'une progression
47,7 → 63,4 qui n'apparaît nulle part dans Notion. Le rapport #1 donne une valeur
unique, 54,91 %, explicitement sans point de comparaison.

**Les exports Clarity T0 et T1 sont à retrouver ou à refaire** : l'API Clarity ne
remonte que 3 jours, donc ces deux périodes ne sont plus extractibles
automatiquement. Si les exports n'existent pas, le KPI scroll depth n'est pas
historisable et il faut le dire au client plutôt que de l'estimer.

---

## 6. Les leads ne passent pas par `/get-a-demo`

Le brief demande de compter « les soumissions du formulaire `/get-a-demo` » et
d'en tirer le ROI. Le rapport #1 montre :

- `contact_submitted` : **41 conversions sur 42**
- `demo_requested` : **1 conversion sur 42** (USA, gamme Newton)

Un ROI calculé sur les seules demandes de démo sous-estimerait l'acquisition d'un
facteur ~40. Le script GA4 remonte les deux événements, et le notebook affiche la
répartition par source.

Deuxième point sur ce sujet : **83 % des conversions sont en source Direct**, 14 %
seulement en organique (Google + Bing). Attribuer au SEO l'ensemble des leads
serait faux ; c'est la part organique qui progresse qui compte.

---

## 7. Valeur d'un lead : non documentée

Le brief demande « ROI approximatif (leads × valeur estimée d'un lead) ». Aucune
valeur de lead n'existe dans Notion. Le notebook laisse
`VALEUR_LEAD_EUR = None` et refuse de calculer tant qu'Anaïs n'a pas validé une
hypothèse. Un ROI bâti sur une valeur inventée est la chose la plus facile à
démolir en réunion de reconduction.

Anaïs a par ailleurs donné des volumes exploitables au call du 10 juillet :
42 demandes en juin (record), dont 28 systèmes — Fusion Absolute 11, Gel Doc 8,
Newton 6. C'est une meilleure base de discussion qu'un ROI € inventé.

---

## 8. Webflow : le site accessible n'est pas le bon

Vérifié le 24/09/2026 dans l'espace Webflow Studio Visuweb : le site
« Vilber » (`6901cf424692349e4d2b5192`) est une **copie de développement** —
dernier publish **10/12/2025**, aucun domaine personnalisé, **0 soumission de
formulaire**. Il contient bien les formulaires attendus (`Book a demo Form` sur
la page Demo, `Support Form` sur Contact) mais sans données.

**Le token Webflow doit venir de l'espace de Vilber**, pas du nôtre. Sinon
`extract_webflow.py` renverra une liste vide sans lever d'erreur — il journalise
un avertissement explicite dans ce cas.

---

## 9. Divergences mineures à confirmer

| Sujet | Brief | Notion |
|---|---|---|
| Tarif de l'engagement | 1 100 €/mois | **1 200 €/mois** (fiche client + guide d'appel) |
| Article « quantification » | placé en M2 | placé en **M3** (Stratégie M3 V2) |
| Article 3 M2 « chemi » | mentionné | absent des plans Notion |
| Money page `/systems/uv-instruments` | listée | les pages vues en GSC sont `/uv-instrument/uv-*` — l'existence de la page catégorie reste à vérifier |
| M3 « article ImageJ » | présenté comme un article dédié | c'est l'angle recadré de l'article quantification (ne pas critiquer ImageJ) |

Le plan M3 réel, validé au call du 10 juillet : Western Blot Troubleshooting,
WB Quantification (ImageJ + quantification absolue), Guide UV Irradiation
(Bio-Sun / Bio-Link), plus **3 articles X-Ray rédigés par le directeur Vilber**
que nous avons optimisés (metas livrés). Ces trois derniers ne figurent pas dans
le brief et doivent apparaître au bilan : c'est du travail livré.

---

## Ce qu'il faut de ta part pour lever ces points

1. Trancher la définition de T1 (point 1) — **bloquant pour tout le reste**.
2. Confirmer la baseline impressions : 12 835 ou 26 417, et sur quel périmètre géo.
3. Choisir la définition de « branded » qui sera présentée à Anaïs (point 3).
4. Dire si les exports Clarity T0/T1 existent quelque part (point 5).
5. Valider — ou renoncer à — une valeur de lead (point 7).
6. Obtenir un token Webflow côté Vilber, ou acter qu'on lit les leads via GA4 seul.
7. Confirmer le tarif : 1 100 ou 1 200 €/mois.
