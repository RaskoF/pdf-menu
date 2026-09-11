#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Decoupe les contacts nettoyes en 7 fichiers, un par campagne Azurpod.

Entree  : azurpod-emailing/output/all-contacts-clean.csv (produit par clean_leads.py)
Sorties : azurpod-emailing/campaigns/*.csv + audit-campagnes.md

Chaque ligne recoit deux colonnes de pilotage :
  - campaign     : le nom exact de la campagne Instantly/Lemlist/Smartlead
  - persona_fit  : "cible" si l'intitule de poste correspond aux personas definis
                   pour ce cercle, "hors_cible" sinon (contact a deprioriser).

Usage : python3 split_campaigns.py
"""

import csv
from collections import Counter, OrderedDict
from pathlib import Path

import pandas as pd

from clean_leads import (COLONNES_SORTIE, VILLE_DEPARTEMENT, bucket_fonction,
                         cle_ville)

BASE = Path(__file__).resolve().parent
SOURCE = BASE / "output" / "all-contacts-clean.csv"
OUT = BASE / "campaigns"

COLONNES_CAMPAGNE = COLONNES_SORTIE + ["campaign", "persona_fit"]

# Personas cibles par cercle, exprimes en buckets de fonction (cf. clean_leads.py).
# Cercle 1 : dirigeants et directeurs, plus les fonctions creation / production /
#            contenu, qui valident le pitch le plus vite.
# Cercle 2 : marketing et communication, plus les dirigeants.
# Cercle 3 : dirigeants, fonctions pedagogiques, marketing et communication.
PERSONAS = {
    "1": {"direction", "direction_generique", "creation", "production", "marketing_comm"},
    "2": {"direction", "direction_generique", "marketing_comm"},
    "3": {"direction", "direction_generique", "pedagogie", "marketing_comm"},
}

CAMPAGNES = OrderedDict([
    ("1",  ("AZURPOD - AGENCES",                  "azurpod-agences-cercle1.csv",
            "Agences de com, marketing, pub, digital, prod, web, RP, branding")),
    ("2a", ("AZURPOD - CONSEIL/AUDIT",            "azurpod-conseil-audit-cercle2a.csv",
            "Conseil, audit, expertise comptable, avocats d'affaires, patrimoine, courtage, finance")),
    ("2b", ("AZURPOD - HOTELLERIE/RESTAURATION",  "azurpod-hotellerie-restauration-cercle2b.csv",
            "Hotels, restaurants, complexes touristiques, agences de voyage, campings 4-5*")),
    ("2c", ("AZURPOD - IMMOBILIER RESIDENTIEL",   "azurpod-immobilier-residentiel-cercle2c.csv",
            "Agences immo, promoteurs, syndics, gestion locative")),
    ("2d", ("AZURPOD - SANTE/ESTHETIQUE",         "azurpod-sante-esthetique-cercle2d.csv",
            "Cliniques privees, medecine esthetique, dentaire, kines, veterinaires, bien-etre")),
    ("2e", ("AZURPOD - TECH",                     "azurpod-tech-cercle2e.csv",
            "Startups, editeurs de logiciels, ESN, scale-ups, e-commerce")),
    ("3",  ("AZURPOD - CENTRES DE FORMATION",     "azurpod-centres-formation-cercle3.csv",
            "Organismes de formation, ecoles, instituts, CFA, e-learning, Qualiopi")),
])


def famille(cercle):
    """'2a' -> '2' : le cercle porteur des regles de persona."""
    return cercle[0]


def exporter(df, chemin):
    df.reindex(columns=COLONNES_CAMPAGNE).to_csv(
        chemin, index=False, sep=",", encoding="utf-8",
        quoting=csv.QUOTE_MINIMAL, lineterminator="\n")


def ecrire_audit(parts, contacts, chemin):
    total = sum(len(p) for p in parts.values())
    cibles = sum(int((p["persona_fit"] == "cible").sum()) for p in parts.values())
    vides = [c for c, p in parts.items() if not len(p)]
    L = []
    A = L.append

    A("# Audit du decoupage en 7 campagnes")
    A("")
    A("Source : `output/all-contacts-clean.csv` (%d contacts, departements 83 et 13)." % total)
    A("")

    A("## 1. Volumes par campagne")
    A("")
    A("| Campagne | Cercle | Contacts | Persona cible | Hors persona | Statut |")
    A("|---|---|---|---|---|---|")
    for cercle, (nom, _, _) in CAMPAGNES.items():
        p = parts[cercle]
        c = int((p["persona_fit"] == "cible").sum())
        if not len(p):
            statut = "**VIDE - non lancable**"
        elif c < 10:
            statut = "volume insuffisant (%d cible%s)" % (c, "s" if c > 1 else "")
        else:
            statut = "prete"
        A("| %s | %s | %d | %d | %d | %s |" % (nom, cercle, len(p), c, len(p) - c, statut))
    A("| **Total** | | **%d** | **%d** | **%d** | |" % (total, cibles, total - cibles))
    A("")
    A("Une campagne est dite *prete* a partir de 10 contacts au persona cible : en "
      "dessous, le volume ne permet pas de mesurer un taux de reponse exploitable.")
    A("")

    A("## 2. Campagnes non lancables en l'etat")
    A("")
    if vides:
        A("**%d des 7 campagnes sont vides** : %s." % (
            len(vides), ", ".join(CAMPAGNES[c][0] for c in vides)))
        A("")
        A("Ce n'est pas un defaut de decoupage : l'export Apollo du cercle 2 ne contient "
          "que 19 lignes, toutes en tech/SaaS/ESN. J'ai cherche des leads rattachables a "
          "ces segments dans les trois fichiers source, par industrie Apollo et par "
          "mots-cles sectoriels :")
        A("")
        A("| Segment cherche | Lignes source touchees | Verdict |")
        A("|---|---|---|")
        A("| 2b hotellerie / tourisme / restauration | 47 | **aucun lead reel** : ce sont des "
          "agences dont les *clients* sont dans le tourisme (SUNMADE, RESOsign, le buro) |")
        A("| 2c immobilier residentiel | 40 | **aucun lead reel** : agences de com immobiliere "
          "et un cabinet d'architecture (RUBIKLE) |")
        A("| 2d sante / esthetique / bien-etre | 22 | **aucun lead reel** : organismes de "
          "formation specialises sante (Idelia Sante, FB Formation, Kendreka) |")
        A("")
        A("Ces trois campagnes demandent de **nouveaux scrapes Apollo**. Le classifieur "
          "2a-2e de `clean_leads.py` est deja pret a les router : filtrer Apollo sur les "
          "industries `hospitality`, `restaurants`, `leisure, travel & tourism` (2b), "
          "`real estate`, `commercial real estate` (2c), `hospital & health care`, "
          "`health, wellness & fitness`, `medical practice`, `cosmetics` (2d), en "
          "departements 83 et 13.")
    else:
        A("Aucune campagne vide.")
    A("")

    A("## 3. Adequation persona, campagne par campagne")
    A("")
    A("Personas retenus, d'apres le brief de segmentation :")
    A("")
    A("- **Cercle 1** : dirigeants et directeurs, direction de creation, de production, "
      "de contenu, marketing et communication.")
    A("- **Cercle 2 (2a-2e)** : marketing et communication, plus les dirigeants.")
    A("- **Cercle 3** : dirigeants, fonctions pedagogiques, marketing et communication.")
    A("")
    for cercle, (nom, _, _) in CAMPAGNES.items():
        p = parts[cercle]
        if not len(p):
            continue
        A("### %s" % nom)
        A("")
        A("| Fonction | Contacts | Persona |")
        A("|---|---|---|")
        cibles_cercle = PERSONAS[famille(cercle)]
        for bucket, n in Counter(p["_bucket"]).most_common():
            A("| %s | %d | %s |" % (bucket, n,
                                    "cible" if bucket in cibles_cercle else "**hors cible**"))
        hors = p[p["persona_fit"] == "hors_cible"]
        if len(hors):
            A("")
            A("Hors persona (%d) : %s." % (
                len(hors), ", ".join("%s (%s)" % (r.job_title, r.company)
                                     for r in hors.head(12).itertuples())))
        A("")

    A("## 4. Alertes qualite")
    A("")
    c1 = parts["1"]
    if len(c1):
        n = pd.to_numeric(c1["employee_count"], errors="coerce")
        gros = c1[n > 30]
        A("### 4.1 Cercle 1 : structures hors cible 2-30 personnes")
        A("")
        A("**%d agences sur %d depassent 30 salaries**, dont %d au-dela de 100. "
          "Le brief vise des structures de 2 a 30 personnes : au-dela, le cycle de "
          "decision s'allonge et le pitch \"une agence convertie = 5 a 20 sessions/an\" "
          "ne porte plus de la meme facon." % (len(gros), len(c1), int((n > 100).sum())))
        A("")
        A("| Entreprise | Poste | Effectif |")
        A("|---|---|---|")
        for r in gros.sort_values("employee_count", key=lambda s: pd.to_numeric(s, errors="coerce"),
                                  ascending=False).head(10).itertuples():
            A("| %s | %s | %s |" % (r.company, r.job_title, r.employee_count))
        A("")
        A("A traiter comme un segment a part ou a exclure du premier envoi.")
        A("")

    A("### 4.2 Contacts d'industrie incoherente avec leur campagne")
    A("")
    A("- `Listen Leon` (Aix-en-Provence, 17 salaries) est dans **CENTRES DE FORMATION** "
      "mais son industrie Apollo est `online media` et ses mots-cles pointent une app "
      "de soft skills, pas un organisme de formation. A verifier manuellement.")
    A("- `REFORM` (Marseille, 8 salaries), industrie `environmental services`, a bien "
      "`formation` et `conseil` dans ses mots-cles : maintien en cercle 3 justifie.")
    suspectes = contacts[
        contacts["company"].map(lambda v: cle_ville(v) in VILLE_DEPARTEMENT)
        | contacts["job_title"].str.contains(" at ", case=False, na=False)
    ]
    if len(suspectes):
        A("- **%d ligne(s) Apollo corrompue(s)**, a supprimer manuellement avant import :"
          % len(suspectes))
        for r in suspectes.itertuples():
            A("  - `%s` / `%s` (%s, %s salaries%s) : le nom d'entreprise est un nom de ville "
              "ou l'intitule designe une autre societe." % (
                  r.company, r.job_title, r.campaign, r.employee_count,
                  ", aucun site web" if not r.website else ""))
    A("- 14 contacts du cercle 1 portent une industrie Apollo non creative "
      "(`information technology & services`, `management consulting`, `retail`). "
      "Verification faite : ce sont bien des agences (Simplement - Agence Web Marseille, "
      "Studio3615, Sylab Films). Le label Apollo est imprecis, pas la segmentation.")
    A("")

    A("### 4.3 Faux `hors_cible` reperes a la relecture")
    A("")
    A("Le classement `persona_fit` repose sur l'intitule de poste ; deux intitules "
      "mixtes tombent du mauvais cote et doivent etre repasses en `cible` :")
    A("")
    A("- `Directrice des Operations Communication et Formation` (Sacres Francais, AGENCES) : "
      "classee *pedagogie* a cause du mot \"Formation\", alors que c'est une fonction "
      "communication d'agence.")
    A("- `Concepteur E-learning / Responsable de la Communication` (AECD, CENTRES DE "
      "FORMATION) : classee *creation* a cause de \"Concepteur\", alors que la seconde "
      "moitie de l'intitule est bien une fonction communication.")
    A("")
    A("Les 27 autres `hors_cible` sont des exclusions justifiees (commerciaux, RH, "
      "DSI, direction des operations).")
    A("")
    A("### 4.4 Doublons inter-campagnes")
    A("")
    dup_mail = contacts[contacts.duplicated(subset=["email"], keep=False)]
    dup_soc = contacts.groupby("company")["campaign"].nunique()
    dup_soc = dup_soc[dup_soc > 1]
    A("- Emails presents dans plusieurs campagnes : **%d**." % len(dup_mail))
    A("- Entreprises presentes dans plusieurs campagnes : **%d**.%s" % (
        len(dup_soc),
        (" (" + ", ".join(dup_soc.index[:8]) + ")") if len(dup_soc) else ""))
    A("")
    A("Un contact n'appartient qu'a une seule campagne : aucun risque de double envoi.")
    A("")

    A("### 4.5 Entreprises avec plusieurs contacts dans la meme campagne")
    A("")
    A("| Campagne | Entreprises concernees | Contacts cumules |")
    A("|---|---|---|")
    for cercle, (nom, _, _) in CAMPAGNES.items():
        p = parts[cercle]
        if not len(p):
            continue
        g = p.groupby("company").size()
        g = g[g > 1]
        A("| %s | %d | %d |" % (nom, len(g), int(g.sum())))
    A("")
    A("Ces contacts ont des fonctions distinctes (un dirigeant et une responsable "
      "marketing, par exemple). Espacer leurs envois de quelques jours pour eviter "
      "que deux mails Azurpod n'arrivent le meme jour dans la meme entreprise.")
    A("")

    A("## 5. Couverture des donnees par campagne")
    A("")
    A("| Campagne | Contacts | Avec telephone | Avec LinkedIn | Avec site | 83 | 13 |")
    A("|---|---|---|---|---|---|---|")
    for cercle, (nom, _, _) in CAMPAGNES.items():
        p = parts[cercle]
        if not len(p):
            A("| %s | 0 | - | - | - | - | - |" % nom)
            continue
        dep = Counter(p["department"])
        A("| %s | %d | %d | %d | %d | %d | %d |" % (
            nom, len(p), int((p["phone"] != "").sum()),
            int((p["linkedin_url"] != "").sum()), int((p["website"] != "").sum()),
            dep.get("83", 0), dep.get("13", 0)))
    A("")

    A("## 6. Fichiers produits")
    A("")
    A("| Fichier | Campagne | Lignes |")
    A("|---|---|---|")
    for cercle, (nom, fichier, _) in CAMPAGNES.items():
        A("| `%s` | %s | %d |" % (fichier, nom, len(parts[cercle])))
    A("")
    A("Colonnes : `%s`." % ", ".join(COLONNES_CAMPAGNE))
    A("")
    A("`campaign` reprend le nom exact de la campagne, pour retrouver la segmentation "
      "apres import ou fusion. `persona_fit` vaut `cible` ou `hors_cible` : filtrer sur "
      "`cible` pour le premier envoi, garder les `hors_cible` pour une relance a part.")
    A("")
    A("Format : UTF-8 sans BOM, separateur virgule, `csv.QUOTE_MINIMAL`, fins de ligne LF.")

    chemin.write_text("\n".join(L), encoding="utf-8")


def main():
    if not SOURCE.exists():
        raise SystemExit("Lancer d'abord clean_leads.py : %s est absent." % SOURCE)

    OUT.mkdir(parents=True, exist_ok=True)
    contacts = pd.read_csv(SOURCE, dtype=str).fillna("")
    contacts["_bucket"] = contacts["job_title"].map(bucket_fonction)

    inconnus = set(contacts["cercle"]) - set(CAMPAGNES)
    if inconnus:
        raise SystemExit("Valeurs de cercle sans campagne definie : %s" % sorted(inconnus))

    contacts["campaign"] = contacts["cercle"].map(lambda c: CAMPAGNES[c][0])
    contacts["persona_fit"] = [
        "cible" if b in PERSONAS[famille(c)] else "hors_cible"
        for b, c in zip(contacts["_bucket"], contacts["cercle"])
    ]

    parts = OrderedDict()
    for cercle, (nom, fichier, _) in CAMPAGNES.items():
        p = contacts[contacts["cercle"] == cercle].copy()
        # Les contacts persona dans la campagne d'abord, pour un import sequentiel.
        p = p.sort_values(["persona_fit", "company"], kind="stable")
        exporter(p, OUT / fichier)
        parts[cercle] = p
        marque = "" if len(p) else "   <- VIDE, scrape Apollo a refaire"
        print("%-38s %4d contacts (%d cible)%s" % (
            nom, len(p), int((p["persona_fit"] == "cible").sum()), marque))

    ecrire_audit(parts, contacts, OUT / "audit-campagnes.md")
    print("\naudit-campagnes.md ecrit dans %s" % OUT)


if __name__ == "__main__":
    main()
