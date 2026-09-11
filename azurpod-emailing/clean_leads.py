#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Nettoyage des exports Apollo pour la campagne cold emailing Azurpod.

Entrees  : azurpod-emailing/source/azurpod-scrapping-cercle{1,2,3}-*.csv (schema Apollo 73 colonnes)
Sorties  : azurpod-emailing/output/cercle{1,2,3}-*-clean.csv, all-contacts-clean.csv,
           hors-perimetre.csv, recap.md

Usage : python3 clean_leads.py [--departements 83,13]
"""

import argparse
import csv
import re
import unicodedata
from collections import Counter, OrderedDict
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parent
SRC = BASE / "source"
OUT = BASE / "output"

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

FICHIERS = OrderedDict([
    ("1", {
        "src": "azurpod-scrapping-cercle1-agences.csv",
        "out": "cercle1-agences-clean.csv",
        "label": "Cercle 1 - Agences",
    }),
    ("2", {
        "src": "azurpod-scrapping-cercle2-tpe-pme-eti.csv",
        "out": "cercle2-tpe-pme-eti-clean.csv",
        "label": "Cercle 2 - TPE/PME/ETI",
    }),
    ("3", {
        "src": "azurpod-scrapping-cercle3-formation.csv",
        "out": "cercle3-formation-clean.csv",
        "label": "Cercle 3 - Centres de formation",
    }),
])

COLONNES_SORTIE = [
    "first_name", "last_name", "email", "phone", "company", "job_title",
    "linkedin_url", "website", "city", "postal_code", "department",
    "employee_count", "industry", "cercle",
]

# Apollo -> snake_case. Le telephone est traite a part (plusieurs colonnes sources).
RENOMMAGE = {
    "First Name": "first_name",
    "Last Name": "last_name",
    "Email": "email",
    "Company Name": "company",
    "Title": "job_title",
    "Person Linkedin Url": "linkedin_url",
    "Website": "website",
    "# Employees": "employee_count",
    "Industry": "industry",
}

# Ordre de preference : portable d'abord, standard en dernier recours.
COLONNES_TELEPHONE = [
    "Mobile Phone", "Work Direct Phone", "Home Phone",
    "Other Phone", "Corporate Phone", "Company Phone",
]

PREFIXES_GENERIQUES = {
    "contact", "info", "hello", "admin", "support", "welcome", "team",
}

# Departements cibles par defaut.
DEPARTEMENTS_CIBLES = ["83", "13"]

# Mapping ville -> departement pour les communes presentes dans les exports.
# Sert de repli quand Company Address ne contient pas de code postal, et a
# rattraper les contacts bases en 83/13 dont le siege social est ailleurs.
VILLE_DEPARTEMENT = {
    "aiglun": "04", "aix en provence": "13", "allauch": "13", "antibes": "06",
    "arles": "13", "aubagne": "13", "avignon": "84", "biot": "06",
    "bouc bel air": "13", "cabries": "13", "cagnes sur mer": "06",
    "cannes": "06", "carpentras": "84", "carqueiranne": "83",
    "chateaurenard": "13", "cuers": "83", "eguilles": "13", "fayence": "83",
    "frejus": "83", "gap": "05", "gemenos": "13", "hyeres": "83",
    "la ciotat": "13", "la garde": "83", "la gaude": "06", "lambesc": "13",
    "le barroux": "84", "le revest les eaux": "83", "le val": "83",
    "les pennes mirabeau": "13", "mandelieu la napoule": "06",
    "manosque": "04", "marignane": "13", "marseille": "13", "martigues": "13",
    "meyrargues": "13", "mougins": "06", "nice": "06", "pertuis": "84",
    "plan de cuques": "13", "saint jean cap ferrat": "06",
    "saint raphael": "83", "saint vallier de thiey": "06",
    "saint victoret": "13", "salon de provence": "13", "sisteron": "04",
    "six fours les plages": "83", "toulon": "83", "tourves": "83",
    "valbonne": "06", "velaux": "13", "vence": "06", "venelles": "13",
    # communes hors region rencontrees dans les adresses de siege
    "paris": "75", "levallois perret": "92", "boulogne billancourt": "92",
    "bordeaux": "33", "lyon": "69", "muenchen": None,
}

# Classification des sous-segments du cercle 2, par industrie Apollo.
INDUSTRIE_SOUS_SEGMENT = {
    # 2a - Services B2B a fort panier
    "management consulting": "2a", "accounting": "2a", "law practice": "2a",
    "legal services": "2a", "financial services": "2a", "banking": "2a",
    "insurance": "2a", "venture capital & private equity": "2a",
    "investment management": "2a", "investment banking": "2a",
    "staffing & recruiting": "2a", "human resources": "2a",
    "international trade & development": "2a", "business supplies & equipment": "2a",
    "professional services": "2a", "outsourcing/offshoring": "2a",
    # 2b - Hotellerie, tourisme, restauration
    "hospitality": "2b", "restaurants": "2b", "food & beverages": "2b",
    "leisure, travel & tourism": "2b", "recreational facilities & services": "2b",
    "events services": "2b", "wine & spirits": "2b", "airlines/aviation": "2b",
    # 2c - Immobilier residentiel
    "real estate": "2c", "commercial real estate": "2c",
    "architecture & planning": "2c", "construction": "2c",
    # 2d - Sante, esthetique, bien-etre
    "hospital & health care": "2d", "health, wellness & fitness": "2d",
    "medical practice": "2d", "medical devices": "2d", "veterinary": "2d",
    "cosmetics": "2d", "mental health care": "2d", "pharmaceuticals": "2d",
    "alternative medicine": "2d", "sports": "2d",
    # 2e - Tech, SaaS, scale-ups
    "information technology & services": "2e", "computer software": "2e",
    "internet": "2e", "computer & network security": "2e",
    "computer hardware": "2e", "computer networking": "2e",
    "telecommunications": "2e", "semiconductors": "2e",
    "consumer electronics": "2e", "e-learning": "2e",
}

# Repli par mots-cles Apollo quand l'industrie n'est pas mappee.
MOTSCLES_SOUS_SEGMENT = [
    ("2a", ["expert comptable", "comptabilite", "conseil", "audit", "avocat",
            "juridique", "patrimoine", "courtage", "assurance", "finance",
            "gestion de patrimoine", "recrutement", "cabinet"]),
    ("2b", ["hotel", "restaurant", "tourisme", "camping", "hospitality",
            "voyage", "traiteur", "gastronomie", "village vacances"]),
    ("2c", ["immobilier", "syndic", "promoteur", "gestion locative",
            "agence immobiliere", "real estate"]),
    ("2d", ["sante", "clinique", "dentaire", "esthetique", "bien etre",
            "kine", "veterinaire", "ophtalmologie", "fitness", "salle de sport"]),
    ("2e", ["saas", "esn", "startup", "scaleup", "logiciel", "software",
            "cloud", "ecommerce", "e commerce", "plateforme", "api", "data"]),
]

# Buckets de fonction : deux contacts d'une meme entreprise sont conserves
# seulement si leurs postes relevent de buckets differents.
BUCKETS_FONCTION = [
    ("direction", ["founder", "fondateur", "co founder", "cofounder", "ceo",
                   "president", "presidente", "owner", "gerant", "gerante",
                   "managing director", "directeur general", "general manager",
                   "dirigeant", "associe", "partner", "chief executive"]),
    ("marketing_comm", ["marketing", "communication", "cmo", "brand", "growth",
                        "digital", "social media", "content", "acquisition",
                        "relations presse", "press"]),
    ("creation", ["creative", "artistic", "artistique", "design", "directeur de creation",
                  "dircom creatif", "concepteur"]),
    ("production", ["production", "producteur", "productrice", "realisateur",
                    "studio manager", "post production"]),
    ("pedagogie", ["pedagogique", "pedagogie", "formation", "educational",
                   "academic", "training", "enseignement", "referent"]),
    ("commercial", ["sales", "commercial", "business development", "account",
                    "key account", "territory", "revenue", "cro", "partnership"]),
    ("rh", ["human resources", "ressources humaines", "recruitment", "recrutement",
            "talent", "people"]),
    ("tech", ["cto", "technical", "technique", "engineering", "engineer",
              "developpeur", "developer", "product", "data", "it manager",
              "systeme", "devops"]),
    ("operations", ["operation", "operationnel", "coo", "project manager",
                    "projet", "office manager", "administratif", "logistique",
                    "payroll", "paie", "finance", "cfo", "gestion"]),
]

# Priorite de conservation a l'interieur d'une entreprise.
PRIORITE_BUCKET = {
    "direction": 0, "marketing_comm": 1, "pedagogie": 2, "creation": 3,
    "production": 4, "commercial": 5, "operations": 6, "tech": 7, "rh": 8,
    "autre": 9,
}


# --------------------------------------------------------------------------- #
# Utilitaires
# --------------------------------------------------------------------------- #

def sans_accent(valeur):
    """Minuscules sans accent ni ponctuation parasite, pour comparer des libelles."""
    if not isinstance(valeur, str):
        return ""
    txt = unicodedata.normalize("NFKD", valeur)
    txt = "".join(c for c in txt if not unicodedata.combining(c))
    return txt.lower().strip()


def cle_ville(valeur):
    """Cle de lookup pour VILLE_DEPARTEMENT : sans accent, separateurs unifies."""
    txt = sans_accent(valeur)
    txt = re.sub(r"[^a-z0-9]+", " ", txt)
    return re.sub(r"\s+", " ", txt).strip()


def vide(valeur):
    return valeur is None or (isinstance(valeur, float) and pd.isna(valeur)) \
        or (isinstance(valeur, str) and not valeur.strip())


def texte(valeur):
    return "" if vide(valeur) else str(valeur).strip()


def extraire_code_postal(adresse):
    """Apollo n'exporte pas de colonne code postal : il est en fin de
    'Company Address' ('.., Marseille, Provence-Alpes-Cote d'Azur, France, 13001').
    On prend le dernier groupe de 5 chiffres isole."""
    if vide(adresse):
        return ""
    trouves = re.findall(r"(?<!\d)(\d{5})(?!\d)", str(adresse))
    return trouves[-1] if trouves else ""


def indicatif_pays(brut):
    """Indicatif lisible d'un numero international ('+1 705-230-8831' -> '+1')."""
    texte_brut = str(brut).lstrip("'\u2019").strip()
    m = re.match(r"^\+(\d{1,4})[\s./()-]", texte_brut)
    if m:
        return "+" + m.group(1)
    chiffres = re.sub(r"\D", "", texte_brut)
    return "+" + chiffres[:2] if chiffres else "+?"


def normaliser_telephone(brut):
    """Retourne (numero_e164_francais, motif_rejet).

    Regles : format cible +33XXXXXXXXX sans espace. 0XXXXXXXXX et 0X.XX.XX.XX.XX
    sont convertis. Tout numero non francais ou de longueur invalide est ecarte
    (chaine vide) plutot que renseigne corrompu.
    """
    if vide(brut):
        return "", None
    # Apollo prefixe ses telephones d'une apostrophe pour bloquer Excel.
    nettoye = re.sub(r"[^\d+]", "", str(brut).lstrip("'’"))
    if not nettoye:
        return "", "illisible"

    if nettoye.startswith("+"):
        chiffres = nettoye[1:]
        if not chiffres.startswith("33"):
            return "", "indicatif etranger %s" % indicatif_pays(brut)
        national = chiffres[2:]
    elif nettoye.startswith("0033"):
        national = nettoye[4:]
    elif nettoye.startswith("33") and len(nettoye) == 11:
        national = nettoye[2:]
    elif nettoye.startswith("0"):
        national = nettoye[1:]
    else:
        return "", "format non reconnu"

    national = national.lstrip("0")
    if len(national) != 9 or not national.isdigit() or national[0] not in "123456789":
        return "", "longueur invalide (%d chiffres)" % len(national)
    return "+33" + national, None


def choisir_telephone(ligne):
    """Parcourt les colonnes telephone par ordre de preference (portable > fixe).

    Retourne (numero, rejets) ou rejets est une liste de (valeur_brute, motif)
    dedoublonnee : Apollo duplique le meme standard dans 'Corporate Phone' et
    'Company Phone', il ne doit etre compte qu'une fois.
    """
    rejets, vus = [], set()
    for colonne in COLONNES_TELEPHONE:
        if colonne not in ligne.index or vide(ligne[colonne]):
            continue
        valeur = texte(ligne[colonne]).lstrip("'\u2019")
        numero, motif = normaliser_telephone(ligne[colonne])
        if numero:
            return numero, rejets
        if motif and valeur not in vus:
            vus.add(valeur)
            rejets.append((valeur, motif))
    return "", rejets


def departement_depuis_ville(*villes):
    for ville in villes:
        dep = VILLE_DEPARTEMENT.get(cle_ville(ville))
        if dep:
            return dep
    return ""


def sous_segment_cercle2(industrie, motscles, entreprise):
    """Classification 2a-2e : l'industrie Apollo prime, les mots-cles servent de repli."""
    ind = sans_accent(industrie)
    if ind in INDUSTRIE_SOUS_SEGMENT:
        return INDUSTRIE_SOUS_SEGMENT[ind], "industrie"
    corpus = " ".join(sans_accent(v) for v in (motscles, entreprise, industrie))
    corpus = re.sub(r"[^a-z0-9]+", " ", corpus)
    for segment, motifs in MOTSCLES_SOUS_SEGMENT:
        if any(m in corpus for m in motifs):
            return segment, "mots-cles"
    return "2", "non classe"


# Suffixes toleres pour matcher un motif : "operation" -> "operations",
# "design" -> "designer". Le matching reste ancre sur des limites de mots pour
# eviter les faux positifs par sous-chaine ("sales" dans "Salesforce").
_SUFFIXES = r"(?:s|es|er|ers|eur|eurs|euse|euses)?"
_MOTIFS_COMPILES = [
    (nom, re.compile("|".join(r"\b%s%s\b" % (re.escape(m), _SUFFIXES) for m in motifs)))
    for nom, motifs in BUCKETS_FONCTION
]


def bucket_fonction(poste):
    """Regroupe un intitule de poste en bucket de fonction, pour la dedup entreprise."""
    titre = re.sub(r"[^a-z0-9 ]+", " ", sans_accent(poste))
    for nom, motif in _MOTIFS_COMPILES:
        if motif.search(titre):
            return nom
    return "autre"


# --------------------------------------------------------------------------- #
# Pipeline
# --------------------------------------------------------------------------- #

def charger_et_mapper(chemin, cercle):
    """Lit l'export Apollo, renomme les colonnes utiles, derive phone /
    postal_code / department / cercle, et supprime tout le reste."""
    brut = pd.read_csv(chemin, dtype=str)
    stats = {"lignes_source": len(brut), "colonnes_source": brut.shape[1]}

    df = pd.DataFrame(index=brut.index)
    for apollo, cible in RENOMMAGE.items():
        df[cible] = brut[apollo] if apollo in brut.columns else ""

    # Telephone : une seule colonne de sortie, plusieurs sources possibles.
    telephones, rejets = [], []
    for _, ligne in brut.iterrows():
        numero, motifs = choisir_telephone(ligne)
        telephones.append(numero)
        rejets.extend(motifs)
    df["phone"] = telephones
    stats["telephones_rejetes"] = rejets

    # Ville du contact, repli sur la ville du siege.
    df["city"] = [
        texte(c) or texte(cc)
        for c, cc in zip(brut.get("City", ""), brut.get("Company City", ""))
    ]

    # Code postal : extrait de l'adresse du siege (seule source disponible).
    df["postal_code"] = brut.get("Company Address", pd.Series("", index=brut.index)).map(
        extraire_code_postal)

    # Departement : CP du siege s'il est dans la cible, sinon departement de la
    # ville du contact s'il l'est, sinon le premier renseigne des deux.
    departements, sources = [], []
    for cp, ville, ville_siege in zip(df["postal_code"], df["city"],
                                      brut.get("Company City", pd.Series("", index=brut.index))):
        dep_siege = cp[:2] if cp else ""
        dep_ville = departement_depuis_ville(ville, ville_siege)
        if dep_siege in DEPARTEMENTS_CIBLES:
            departements.append(dep_siege); sources.append("code postal siege")
        elif dep_ville in DEPARTEMENTS_CIBLES:
            departements.append(dep_ville); sources.append("ville du contact")
        else:
            departements.append(dep_siege or dep_ville)
            sources.append("code postal siege" if dep_siege else
                           ("ville du contact" if dep_ville else "inconnu"))
    df["department"] = departements
    df["_source_departement"] = sources

    # Le CP disponible est celui du siege. Quand le departement retenu vient de la
    # ville du contact, ce CP designe une autre commune : on le neutralise plutot
    # que d'afficher une ligne contradictoire (ex. postal_code 80992 / department 13).
    incoherents = [
        bool(cp) and dep and cp[:2] != dep
        for cp, dep in zip(df["postal_code"], df["department"])
    ]
    stats["cp_siege_neutralises"] = sum(incoherents)
    df["_cp_neutralise"] = incoherents
    df["postal_code"] = [
        "" if mauvais else cp for cp, mauvais in zip(df["postal_code"], incoherents)
    ]

    # Cercle / sous-segment.
    if cercle == "2":
        segments, origines = [], []
        for ind, kw, ent in zip(brut.get("Industry", ""), brut.get("Keywords", ""),
                                brut.get("Company Name", "")):
            seg, origine = sous_segment_cercle2(ind, kw, ent)
            segments.append(seg); origines.append(origine)
        df["cercle"] = segments
        df["_origine_classification"] = origines
    else:
        df["cercle"] = cercle

    # Colonnes techniques conservees pour les filtres, retirees avant export.
    df["_email_status"] = brut.get("Email Status", pd.Series("", index=brut.index)).fillna("")
    df["_pays"] = brut.get("Country", pd.Series("", index=brut.index)).fillna("")

    for colonne in COLONNES_SORTIE:
        df[colonne] = df[colonne].map(texte) if colonne in df.columns else ""
    df["email"] = df["email"].str.lower()
    df["employee_count"] = pd.to_numeric(df["employee_count"], errors="coerce") \
        .astype("Int64").astype(str).replace({"<NA>": ""})
    return df, stats


def filtrer(df, stats):
    """Filtres email / statut / generiques, puis dedup email et entreprise."""
    ecartes = []

    def rejeter(masque, motif):
        nonlocal df
        if masque.any():
            perdus = df[masque].copy()
            perdus["motif_exclusion"] = motif
            ecartes.append(perdus)
            df = df[~masque]

    # 1. email absent ou syntaxiquement invalide
    sans_email = ~df["email"].str.match(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$", na=False)
    stats["sans_email"] = int(sans_email.sum())
    rejeter(sans_email, "email absent ou invalide")

    # 2. statut de verification Apollo
    non_verifie = ~df["_email_status"].map(sans_accent).isin(["verified", "verifie", ""])
    stats["non_verifies"] = int(non_verifie.sum())
    rejeter(non_verifie, "email_status != verified")

    # 3. emails generiques, sauf domaine unique dans le fichier
    domaines = Counter(df["email"].str.split("@").str[-1])
    prefixe = df["email"].str.split("@").str[0].str.replace(r"[^a-z]", "", regex=True)
    domaine = df["email"].str.split("@").str[-1]
    generique = prefixe.isin(PREFIXES_GENERIQUES) & domaine.map(lambda d: domaines[d] > 1)
    stats["generiques_supprimes"] = int(generique.sum())
    stats["generiques_conserves"] = int(
        (prefixe.isin(PREFIXES_GENERIQUES) & domaine.map(lambda d: domaines[d] == 1)).sum())
    rejeter(generique, "email generique (domaine present plusieurs fois)")

    # 4. doublons d'email
    doublon_email = df.duplicated(subset=["email"], keep="first")
    stats["doublons_email"] = int(doublon_email.sum())
    rejeter(doublon_email, "doublon email")

    # 5. doublons d'entreprise, un contact par bucket de fonction
    df = df.copy()
    df["_company_key"] = df["company"].map(
        lambda v: re.sub(r"[^a-z0-9]", "", sans_accent(v)))
    df["_bucket"] = df["job_title"].map(bucket_fonction)
    df["_priorite"] = df["_bucket"].map(lambda b: PRIORITE_BUCKET.get(b, 9))
    df["_ordre"] = range(len(df))
    df = df.sort_values(["_company_key", "_priorite", "_ordre"])
    doublon_entreprise = df.duplicated(subset=["_company_key", "_bucket"], keep="first")
    stats["doublons_company"] = int(doublon_entreprise.sum())
    stats["multi_contacts"] = int(
        df[~doublon_entreprise].duplicated(subset=["_company_key"], keep=False).sum())
    rejeter(doublon_entreprise, "doublon entreprise (meme fonction)")
    df = df.sort_values("_ordre")

    # 6. perimetre departemental
    hors_zone = ~df["department"].isin(DEPARTEMENTS_CIBLES)
    stats["hors_perimetre"] = int(hors_zone.sum())
    stats["detail_hors_perimetre"] = Counter(
        df.loc[hors_zone, "department"].replace("", "inconnu"))
    rejeter(hors_zone, "departement hors perimetre")

    ecarte = pd.concat(ecartes) if ecartes else pd.DataFrame(columns=list(df.columns) + ["motif_exclusion"])
    return df, ecarte, stats


def exporter(df, chemin, colonnes=None):
    colonnes = colonnes or COLONNES_SORTIE
    df.reindex(columns=colonnes).to_csv(
        chemin, index=False, sep=",", encoding="utf-8",
        quoting=csv.QUOTE_MINIMAL, lineterminator="\n")


# --------------------------------------------------------------------------- #
# Recap
# --------------------------------------------------------------------------- #

def bloc_top(compteur, total, limite=10):
    lignes = []
    for valeur, nombre in compteur.most_common(limite):
        part = 100 * nombre / total if total else 0
        lignes.append("| %s | %d | %.1f %% |" % (valeur or "(non renseigne)", nombre, part))
    return "\n".join(lignes) or "| (aucune donnee) | 0 | 0 % |"


def ecrire_recap(resultats, chemin):
    total_avant = sum(r["stats"]["lignes_source"] for r in resultats.values())
    total_apres = sum(len(r["clean"]) for r in resultats.values())
    L = []
    A = L.append

    A("# Recap nettoyage - campagne cold emailing Azurpod")
    A("")
    A("Source : 3 exports Apollo (73 colonnes chacun), reduits aux %d colonnes utiles."
      % len(COLONNES_SORTIE))
    A("Perimetre retenu : departements %s." % " + ".join(DEPARTEMENTS_CIBLES))
    A("")

    A("## 1. Lignes avant / apres nettoyage")
    A("")
    A("| Cercle | Lignes source | Lignes finales | Taux de conservation |")
    A("|---|---|---|---|")
    for cercle, res in resultats.items():
        avant = res["stats"]["lignes_source"]
        apres = len(res["clean"])
        A("| %s | %d | %d | %.1f %% |" % (res["label"], avant, apres,
                                          100 * apres / avant if avant else 0))
    A("| **Total** | **%d** | **%d** | **%.1f %%** |"
      % (total_avant, total_apres, 100 * total_apres / total_avant if total_avant else 0))
    A("")
    A("Detail des lignes ecartees, par etape :")
    A("")
    A("| Cercle | Sans email | Non verifie | Generique | Doublon email | Doublon entreprise | Hors perimetre |")
    A("|---|---|---|---|---|---|---|")
    for cercle, res in resultats.items():
        s = res["stats"]
        A("| %s | %d | %d | %d | %d | %d | %d |" % (
            res["label"], s["sans_email"], s["non_verifies"], s["generiques_supprimes"],
            s["doublons_email"], s["doublons_company"], s["hors_perimetre"]))
    A("")

    A("## 2. Repartition par departement")
    A("")
    A("| Cercle | 83 (Var) | 13 (Bouches-du-Rhone) | Total |")
    A("|---|---|---|---|")
    for cercle, res in resultats.items():
        c = Counter(res["clean"]["department"])
        A("| %s | %d | %d | %d |" % (res["label"], c.get("83", 0), c.get("13", 0),
                                     len(res["clean"])))
    global_dep = Counter()
    for res in resultats.values():
        global_dep.update(res["clean"]["department"])
    A("| **Total** | **%d** | **%d** | **%d** |"
      % (global_dep.get("83", 0), global_dep.get("13", 0), total_apres))
    A("")
    sources = Counter()
    for res in resultats.values():
        sources.update(res["clean"]["_source_departement"])
    A("Origine du departement retenu (Apollo n'exporte aucune colonne code postal) :")
    A("")
    for src, n in sources.most_common():
        A("- %s : %d contacts" % (src, n))
    A("")

    A("## 3. Repartition par sous-segment - cercle 2")
    A("")
    res2 = resultats.get("2")
    if res2 is not None and len(res2["clean"]):
        libelles = {
            "2a": "Services B2B a fort panier", "2b": "Hotellerie / tourisme / restauration",
            "2c": "Immobilier residentiel", "2d": "Sante / esthetique / bien-etre",
            "2e": "Tech / SaaS / scale-ups", "2": "Non classe",
        }
        c = Counter(res2["clean"]["cercle"])
        A("| Sous-segment | Libelle | Contacts |")
        A("|---|---|---|")
        for seg in ["2a", "2b", "2c", "2d", "2e", "2"]:
            if c.get(seg):
                A("| %s | %s | %d |" % (seg, libelles[seg], c[seg]))
        A("")
        origines = Counter(res2["clean"].get("_origine_classification", []))
        A("Origine de la classification des %d contacts retenus : %s." % (
            len(res2["clean"]),
            ", ".join("%s = %d" % (k, v) for k, v in origines.most_common())))
        A("")
        A("L'industrie Apollo prime ; les mots-cles ne servent de repli que si "
          "l'industrie n'est pas mappee. **L'export ne couvre que le sous-segment 2e** "
          "(tech/SaaS/ESN) : 2b (hotellerie/tourisme), 2c (immobilier) et 2d "
          "(sante/bien-etre) sont absents et demandent de nouveaux scrapes Apollo. "
          "Le classifieur est deja pret a les router.")
    else:
        A("_Aucun contact retenu sur le cercle 2._")
    A("")

    A("## 4. Top 10 des industries par cercle")
    for cercle, res in resultats.items():
        A("")
        A("### %s" % res["label"])
        A("")
        A("| Industrie | Contacts | Part |")
        A("|---|---|---|")
        A(bloc_top(Counter(res["clean"]["industry"]), len(res["clean"])))
    A("")

    A("## 5. Doublons supprimes")
    A("")
    A("| Cercle | Doublons email | Doublons entreprise | Entreprises avec 2+ contacts conserves |")
    A("|---|---|---|---|")
    for cercle, res in resultats.items():
        s = res["stats"]
        A("| %s | %d | %d | %d |" % (res["label"], s["doublons_email"],
                                     s["doublons_company"], s["multi_contacts"]))
    A("")
    A("Regle entreprise : un seul contact par entreprise **et par bucket de fonction**. "
      "Un Founder et une Directrice marketing de la meme structure sont conserves tous les deux ; "
      "deux Account Managers de la meme structure non.")
    A("")

    A("## 6. Couverture telephone")
    A("")
    A("| Cercle | Avec telephone | Sans telephone | Taux de couverture |")
    A("|---|---|---|---|")
    for cercle, res in resultats.items():
        avec = int((res["clean"]["phone"] != "").sum())
        total = len(res["clean"])
        A("| %s | %d | %d | %.1f %% |" % (res["label"], avec, total - avec,
                                          100 * avec / total if total else 0))
    avec_global = sum(int((r["clean"]["phone"] != "").sum()) for r in resultats.values())
    A("| **Total** | **%d** | **%d** | **%.1f %%** |"
      % (avec_global, total_apres - avec_global,
         100 * avec_global / total_apres if total_apres else 0))
    A("")

    A("## 7. Alertes")
    A("")
    A("### 7.1 Colonnes attendues absentes de l'export Apollo")
    A("")
    A("- **Aucune colonne code postal.** Le CP est noye en fin de `Company Address` "
      "(`..., Marseille, Provence-Alpes-Cote d'Azur, France, 13001`) et correspond au **siege social**, "
      "pas au contact. `postal_code` est donc extrait par expression reguliere ; il reste vide "
      "quand l'adresse Apollo n'en contient pas.")
    A("- **`Work Direct Phone`, `Mobile Phone`, `Home Phone` et `Other Phone` sont vides a 100 %** "
      "dans les trois fichiers. La seule source telephone exploitable est `Corporate Phone` "
      "(identique a `Company Phone`), c'est-a-dire le **standard de l'entreprise** : aucune ligne directe.")
    A("- **Aucune colonne de sous-segment 2a-2e** dans l'export du cercle 2 ; les valeurs sont "
      "derivees par le classifieur industrie + mots-cles documente en section 3.")
    A("")

    A("### 7.2 Telephones ecartes")
    A("")
    A("| Cercle | Contacts source concernes | Indicatif etranger | Autre format invalide |")
    A("|---|---|---|---|")
    total_rejets, indicatifs = 0, Counter()
    for cercle, res in resultats.items():
        rejets = res["stats"]["telephones_rejetes"]
        total_rejets += len(rejets)
        etrangers = [m for _, m in rejets if m.startswith("indicatif etranger")]
        indicatifs.update(m.replace("indicatif etranger ", "") for m in etrangers)
        A("| %s | %d | %d | %d |" % (res["label"], len(rejets), len(etrangers),
                                     len(rejets) - len(etrangers)))
    A("| **Total** | **%d** | | |" % total_rejets)
    A("")
    A("%d numeros (comptes sur les fichiers source, avant filtrage) ont ete vides "
      "plutot que renseignes corrompus. "
      "Repartition des indicatifs etrangers : %s." % (
          total_rejets,
          ", ".join("%s (%d)" % (k, v) for k, v in indicatifs.most_common(10))))
    A("")
    A("Exemples :")
    A("")
    exemples = []
    for res in resultats.values():
        exemples.extend(res["stats"]["telephones_rejetes"][:3])
    for valeur, motif in exemples[:9]:
        A("- `%s` -> %s" % (valeur, motif))
    A("")
    A("Il s'agit de standards d'entreprise a indicatif etranger (+1, +49, +55, +41) "
      "attribues par Apollo a des structures pourtant locales : la donnee est fausse, "
      "pas seulement mal formatee. Les conserver aurait pollue la base de phoning.")
    A("")
    A("### 7.3 Contacts incomplets")
    A("")
    A("| Cercle | Sans LinkedIn | Sans site web | Sans code postal | dont CP siege neutralise | Sans effectif |")
    A("|---|---|---|---|---|---|")
    for cercle, res in resultats.items():
        d = res["clean"]
        A("| %s | %d | %d | %d | %d | %d |" % (
            res["label"], int((d["linkedin_url"] == "").sum()),
            int((d["website"] == "").sum()), int((d["postal_code"] == "").sum()),
            int(d["_cp_neutralise"].sum()) if "_cp_neutralise" in d else 0,
            int((d["employee_count"] == "").sum())))
    A("")
    A("`postal_code` est vide dans deux cas : l'adresse Apollo du siege ne contenait "
      "aucun code postal, ou ce CP designait une commune hors du departement retenu "
      "(siege a Paris, contact a Marseille) et a ete neutralise pour ne pas produire "
      "de ligne contradictoire du type `postal_code=75016 / department=13`.")
    A("")

    A("### 7.4 Emails a surveiller")
    A("")
    generiques = sum(r["stats"]["generiques_conserves"] for r in resultats.values())
    A("- Emails generiques conserves (domaine unique dans le fichier) : **%d**." % generiques)
    A("- Emails generiques supprimes : **%d**."
      % sum(r["stats"]["generiques_supprimes"] for r in resultats.values()))
    A("- `Email Status` vaut `Verified` sur 100 % des lignes des trois exports : "
      "aucune ligne ecartee par ce filtre.")
    catchall = []
    for cercle, res in resultats.items():
        n = res["stats"].get("catch_all", 0)
        if n:
            catchall.append("%s : %d" % (res["label"], n))
    if catchall:
        A("- Domaines **catch-all** (verification Apollo moins fiable, risque de bounce accru) : %s. "
          "A envoyer en fin de sequence ou a re-verifier avant envoi." % " ; ".join(catchall))
    A("")

    A("### 7.5 Contacts valides hors perimetre 83/13")
    A("")
    hors = Counter()
    for res in resultats.values():
        hors.update(res["stats"]["detail_hors_perimetre"])
    total_hors = sum(hors.values())
    A("**%d contacts** passent tous les filtres qualite mais sortent du perimetre %s. "
      "Ils sont conserves dans `hors-perimetre.csv` plutot que supprimes."
      % (total_hors, "/".join(DEPARTEMENTS_CIBLES)))
    A("")
    A("| Departement | Contacts |")
    A("|---|---|")
    for dep, n in hors.most_common(12):
        A("| %s | %d |" % (dep, n))
    A("")
    A("Le plus gros gisement est le **06** (Nice, Cannes, Antibes, Valbonne), "
      "concentre sur le cercle 3 : a activer si le perimetre est elargi "
      "(`--departements 83,13,06`).")
    A("")

    A("## 8. Fichiers produits")
    A("")
    A("| Fichier | Contenu | Lignes |")
    A("|---|---|---|")
    for cercle, res in resultats.items():
        A("| `%s` | %s | %d |" % (FICHIERS[cercle]["out"], res["label"], len(res["clean"])))
    A("| `all-contacts-clean.csv` | Les 3 cercles fusionnes | %d |" % total_apres)
    A("| `hors-perimetre.csv` | Contacts valides hors %s | %d |"
      % ("/".join(DEPARTEMENTS_CIBLES), total_hors))
    A("")
    A("Format : UTF-8 sans BOM, separateur virgule, guillemets minimaux (`csv.QUOTE_MINIMAL`), "
      "colonnes dans l'ordre : `%s`." % ", ".join(COLONNES_SORTIE))
    A("")

    chemin.write_text("\n".join(L), encoding="utf-8")


# --------------------------------------------------------------------------- #

def main():
    global DEPARTEMENTS_CIBLES

    parser = argparse.ArgumentParser(description="Nettoyage des exports Apollo Azurpod.")
    parser.add_argument("--departements", default=",".join(DEPARTEMENTS_CIBLES),
                        help="Departements a conserver, separes par des virgules (defaut : 83,13).")
    args = parser.parse_args()

    DEPARTEMENTS_CIBLES = [d.strip().zfill(2) for d in args.departements.split(",") if d.strip()]

    OUT.mkdir(parents=True, exist_ok=True)
    resultats, tous, tous_ecartes = OrderedDict(), [], []

    for cercle, conf in FICHIERS.items():
        chemin = SRC / conf["src"]
        if not chemin.exists():
            raise SystemExit("Fichier source introuvable : %s" % chemin)

        df, stats = charger_et_mapper(chemin, cercle)
        # Compte des domaines catch-all avant de perdre la colonne Apollo.
        brut = pd.read_csv(chemin, dtype=str)
        if "Primary Email Catch-all Status" in brut.columns:
            stats["catch_all"] = int(
                brut["Primary Email Catch-all Status"].map(sans_accent).eq("catch-all").sum())

        clean, ecarte, stats = filtrer(df, stats)
        exporter(clean, OUT / conf["out"])
        resultats[cercle] = {"clean": clean, "stats": stats, "label": conf["label"]}
        tous.append(clean)
        if len(ecarte):
            ecarte = ecarte[ecarte["motif_exclusion"] == "departement hors perimetre"].copy()
            ecarte["cercle_source"] = cercle
            tous_ecartes.append(ecarte)

        print("%-32s %4d -> %4d lignes" % (conf["label"], stats["lignes_source"], len(clean)))

    consolide = pd.concat(tous, ignore_index=True)
    exporter(consolide, OUT / "all-contacts-clean.csv")
    print("%-32s %4s    %4d lignes" % ("all-contacts-clean.csv", "", len(consolide)))

    if tous_ecartes:
        hors = pd.concat(tous_ecartes, ignore_index=True)
        exporter(hors, OUT / "hors-perimetre.csv",
                 COLONNES_SORTIE + ["cercle_source", "motif_exclusion"])
        print("%-32s %4s    %4d lignes" % ("hors-perimetre.csv", "", len(hors)))

    ecrire_recap(resultats, OUT / "recap.md")
    print("recap.md ecrit dans %s" % OUT)


if __name__ == "__main__":
    main()
