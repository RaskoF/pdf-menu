"""Configuration centrale du bilan SEO Vilber (T0 / T1 / T2).

Toutes les dates sont en ISO 8601, fuseau de reference Europe/Paris.
Aucune donnee chiffree de resultat n'est codee ici : ce fichier ne contient
que des definitions (periodes, regex, listes de pages) et des chemins.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date
from pathlib import Path

# --------------------------------------------------------------------------
# Chemins
# --------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = Path(os.environ["DATA_RAW_OVERRIDE"]).resolve() \
    if os.environ.get("DATA_RAW_OVERRIDE") else ROOT / "data" / "raw"
DATA_CONSOLIDATED = ROOT / "data" / "consolidated"
DATA_REFERENCE = ROOT / "data" / "reference"
REPORT_DIR = ROOT / "report"
FIGURES_DIR = REPORT_DIR / "figures"

for _p in (DATA_RAW, DATA_CONSOLIDATED, DATA_REFERENCE, FIGURES_DIR):
    _p.mkdir(parents=True, exist_ok=True)

TIMEZONE = "Europe/Paris"
SITE_URL = os.environ.get("GSC_SITE_URL", "sc-domain:vilber.com")
GA4_PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "")
SEMRUSH_DOMAIN = "vilber.com"


# --------------------------------------------------------------------------
# Periodes
# --------------------------------------------------------------------------

@dataclass(frozen=True)
class Period:
    key: str
    label: str
    start: date
    end: date          # borne incluse
    note: str = ""

    @property
    def days(self) -> int:
        return (self.end - self.start).days + 1

    def as_dict(self) -> dict:
        return {
            "key": self.key,
            "label": self.label,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "days": self.days,
            "note": self.note,
        }


def _d(s: str) -> date:
    return date.fromisoformat(s)


# Periodes principales du bilan.
# NB : les periodes n'ont pas la meme longueur (T0 = 31 j, T1 = 77 j, T2 = 78 j).
# Toute comparaison T0 <-> T1 <-> T2 doit passer par les metriques normalisees
# "par 30 jours" produites par consolidate.py.
PERIODS: dict[str, Period] = {
    "T0": Period(
        "T0", "Baseline (mois precedant le demarrage)",
        _d("2026-03-20"), _d("2026-04-19"),
        "Mois plein precedant le kick-off du 20 avril 2026.",
    ),
    "T1": Period(
        "T1", "Phase 1 (M1-M2)",
        _d("2026-04-20"), _d("2026-07-05"),
        "Perimetre du 1er rapport selon le brief. ATTENTION : le rapport #1 "
        "reellement produit couvre le 26/05 -> 24/06 (cf. docs/ECARTS-BRIEF.md).",
    ),
    "T2": Period(
        "T2", "Phase 2 (M3)",
        _d("2026-07-05"), _d("2026-09-20"),
        "Periode a mesurer. Inclut aout (saisonnalite academique basse).",
    ),
    "GLOBAL": Period(
        "GLOBAL", "Bilan global de l'accompagnement",
        _d("2026-04-20"), _d("2026-09-20"),
        "Consolidation T1 + T2.",
    ),
    # Periodes de reconciliation avec le rapport #1 deja presente au client.
    "R1_COURANT": Period(
        "R1_COURANT", "Rapport #1 - periode courante",
        _d("2026-05-26"), _d("2026-06-24"),
        "Periode exacte du rapport #1 (30 j). Sert a verifier que nos extractions "
        "retrouvent les chiffres deja communiques a Anais.",
    ),
    "R1_COMPARAISON": Period(
        "R1_COMPARAISON", "Rapport #1 - periode de comparaison",
        _d("2026-03-26"), _d("2026-05-25"),
        "61 j, divises par 2 dans le rapport #1 pour un equivalent mensuel.",
    ),
    # Controle de saisonnalite : meme fenetre que T2, un an plus tot.
    "T2_N1": Period(
        "T2_N1", "T2 annee precedente (controle saisonnalite)",
        _d("2025-07-05"), _d("2025-09-20"),
        "Permet d'isoler l'effet 'creux d'aout' de l'effet de notre travail.",
    ),
    "T1_N1": Period(
        "T1_N1", "T1 annee precedente (controle saisonnalite)",
        _d("2025-04-20"), _d("2025-07-05"),
    ),
}

# Periodes extraites par defaut par les scripts d'extraction.
DEFAULT_PERIODS = ["T0", "T1", "T2", "GLOBAL", "R1_COURANT", "R1_COMPARAISON",
                   "T2_N1", "T1_N1"]


# --------------------------------------------------------------------------
# Classification branded / non-branded
# --------------------------------------------------------------------------
#
# Deux definitions coexistent dans les sources Vilber et donnent des resultats
# tres differents. On calcule les DEUX, et le rapport doit dire laquelle il cite.
#
#   - STRICT  : uniquement le nom de marque nu (base "27,2 %" du Notion KPIs)
#   - LARGE   : marque + noms de gammes produit (base "70 %" de la strategie M3)
#
# Voir docs/ECARTS-BRIEF.md, point 3.

BRANDED_STRICT_PATTERNS = [
    r"\bvilber\b",
    r"\blourmat\b",
]

BRANDED_LARGE_PATTERNS = BRANDED_STRICT_PATTERNS + [
    r"\bfusion\b",
    r"\bnewton\b",
    r"\be[\s\-]?box\b",
    r"\bquantum\b",
    r"\bspectra\b",
    r"\bbio[\s\-]?sun\b",
    r"\bbio[\s\-]?link\b",
    r"\bkuant\b",
]


# --------------------------------------------------------------------------
# Money pages et clusters
# --------------------------------------------------------------------------

MONEY_PAGES = {
    "/": "Homepage",
    "/systems/fusion-absolute": "Fusion Absolute (Western Blot)",
    "/systems/newton": "Newton (In Vivo)",
    "/systems/e-box": "E-Box (Gel doc)",
    "/uv-instrument/uv-lamps": "UV Lamps",
    "/uv-instrument/uv-irradiators": "UV Irradiators",
    "/uv-instrument/uv-darkrooms": "UV Darkrooms",
    "/uv-instrument/uv-pads": "UV Pads",
    "/uv-instrument/uv-radiometers": "UV Radiometers",
    "/uv-instrument/uv-tubes": "UV Tubes",
}

# Affectation d'une requete / page a un cluster thematique.
CLUSTERS = {
    "Western Blot": [
        r"western\s*blot", r"\bwb\b", r"chemilumin", r"fusion", r"blot",
        r"quantification", r"imagej",
    ],
    "UV Instruments": [
        r"\buv\b", r"irradiat", r"radiomet", r"darkroom", r"transillumin",
        r"bio[\s\-]?sun", r"bio[\s\-]?link",
    ],
    "In Vivo": [
        r"in\s*vivo", r"newton", r"nir[\s\-]?ii", r"nir[\s\-]?2", r"nir[\s\-]?i\b",
        r"preclinical", r"biolumin", r"fluorescence", r"x[\s\-]?ray", r"tomograph",
    ],
    "Gel Doc": [
        r"gel\s*doc", r"e[\s\-]?box", r"gel\s*documentation", r"electrophore",
    ],
}

# Articles publies, par mois de production. Sert a mesurer l'impact editorial.
# 'slug' = fragment d'URL a matcher dans les pages Search Console.
ARTICLES = [
    # --- M1 (juin 2026) : donnees issues du rapport #1 ---
    {"mois": "M1", "slug": "western-blot-imaging-systems", "titre": "Western Blot Imaging Systems (pilier)", "publie": "2026-06-18", "cluster": "Western Blot"},
    {"mois": "M1", "slug": "fluorescent-western-blot", "titre": "Fluorescent Western Blot", "publie": "2026-06-24", "cluster": "Western Blot"},
    {"mois": "M1", "slug": "gel-documentation-systems", "titre": "Gel Documentation Systems", "publie": "2026-06-24", "cluster": "Gel Doc"},
    {"mois": "M1", "slug": "when-to-use-nir-ii", "titre": "When to Use NIR-II Imaging", "publie": "2026-06-10", "cluster": "In Vivo"},
    {"mois": "M1", "slug": "how-nir-ii-is-emerging", "titre": "How NIR-II Is Emerging", "publie": "2026-06-10", "cluster": "In Vivo"},
    {"mois": "M1", "slug": "can-a-virus-be-made-completely-harmless", "titre": "Can a Virus Be Made Harmless", "publie": "2026-06-10", "cluster": "UV Instruments"},
    {"mois": "M1", "slug": "why-the-choice-of-detectors", "titre": "Why the Choice of Detectors NIR-II", "publie": "2026-06-18", "cluster": "In Vivo"},
    {"mois": "M1", "slug": "in-vivo-imaging-preclinical", "titre": "In Vivo Imaging Preclinical (NIR-I/NIR-II)", "publie": "2026-06-24", "cluster": "In Vivo"},
    {"mois": "M1", "slug": "how-to-develop-nir-ii-probes", "titre": "How to Develop NIR-II Probes", "publie": "2026-06-24", "cluster": "In Vivo"},
    {"mois": "M1", "slug": "seeing-disease-in-motion", "titre": "Seeing Disease in Motion", "publie": "2026-06-24", "cluster": "In Vivo"},
    # --- M3 (juillet / aout 2026) : plan valide, cf. Notion "Strategie M3 V2" ---
    {"mois": "M3", "slug": "western-blot-troubleshooting", "titre": "Western Blot Troubleshooting", "publie": None, "cluster": "Western Blot"},
    {"mois": "M3", "slug": "western-blot-quantification", "titre": "WB Quantification (ImageJ + quantification absolue)", "publie": None, "cluster": "Western Blot"},
    {"mois": "M3", "slug": "uv-irradiation", "titre": "Guide UV Irradiation (Bio-Sun / Bio-Link)", "publie": None, "cluster": "UV Instruments"},
    {"mois": "M3", "slug": "2d-x-ray-vs-3d-tomography-preclinical-imaging", "titre": "2D X-ray vs 3D Tomography", "publie": None, "cluster": "In Vivo"},
    {"mois": "M3", "slug": "fluorescence-x-ray-longitudinal-preclinical-imaging", "titre": "Fluorescence + X-ray (Longitudinal)", "publie": None, "cluster": "In Vivo"},
    {"mois": "M3", "slug": "bioluminescence-x-ray-preclinical-anatomical-context", "titre": "Bioluminescence + X-ray (Anatomical Context)", "publie": None, "cluster": "In Vivo"},
]

# Optimisations techniques a mesurer (date = mise en ligne, a confirmer par Enzo).
OPTIMISATIONS = [
    {"mois": "M1", "chantier": "E-Box metadata", "cible": "/systems/e-box", "date": None},
    {"mois": "M1", "chantier": "Schemas UV Instruments", "cible": "/uv-instrument/", "date": None},
    {"mois": "M2", "chantier": "Schema Fusion Absolute", "cible": "/systems/fusion-absolute", "date": None},
    {"mois": "M2", "chantier": "Meta UV Tubes", "cible": "/uv-instrument/uv-tubes", "date": None},
    {"mois": "M2", "chantier": "Metas X-Ray Vilber", "cible": "/articles/", "date": None},
]

# Concurrents suivis sur les mots-cles strategiques.
COMPETITORS = {
    "bio-rad.com": ["ChemiDoc", "Image Lab"],
    "licor.com": ["Odyssey"],
    "analytik-jena.com": ["UVP", "ChemStudio"],
    "syngene.com": ["G:BOX"],
    "azurebiosystems.com": ["Azure"],
}

TRANCHES_POSITION = [(1, 3), (4, 10), (11, 20), (21, 50), (51, 100)]
