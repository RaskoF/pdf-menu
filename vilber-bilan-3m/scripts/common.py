"""Utilitaires partages : cache disque, logging, classification, normalisation."""

from __future__ import annotations

import json
import logging
import os
import re
import sys
from pathlib import Path
from typing import Any, Callable, Iterable

import pandas as pd

from config import (
    BRANDED_LARGE_PATTERNS,
    BRANDED_STRICT_PATTERNS,
    CLUSTERS,
    DATA_RAW,
    DEFAULT_PERIODS,
    PERIODS,
    Period,
)

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s  %(levelname)-7s %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


class MissingCredentials(RuntimeError):
    """Levee quand une variable d'environnement obligatoire est absente."""


def require_env(*names: str) -> list[str]:
    """Retourne les valeurs des variables demandees, ou explique ce qui manque."""
    missing = [n for n in names if not os.environ.get(n)]
    if missing:
        raise MissingCredentials(
            "Variables d'environnement manquantes : "
            + ", ".join(missing)
            + "\nRenseignez-les dans .env (cf. .env.example) puis relancez."
        )
    return [os.environ[n] for n in names]


# --------------------------------------------------------------------------
# Periodes
# --------------------------------------------------------------------------

def resolve_periods(keys: Iterable[str] | None = None) -> list[Period]:
    keys = list(keys) if keys else DEFAULT_PERIODS
    unknown = [k for k in keys if k not in PERIODS]
    if unknown:
        raise KeyError(f"Periode(s) inconnue(s) : {unknown}. Connues : {list(PERIODS)}")
    return [PERIODS[k] for k in keys]


# --------------------------------------------------------------------------
# Cache disque
# --------------------------------------------------------------------------

def cache_path(source: str, period_key: str, dataset: str, ext: str = "json") -> Path:
    directory = DATA_RAW / source
    directory.mkdir(parents=True, exist_ok=True)
    return directory / f"{period_key}__{dataset}.{ext}"


def cached_json(path: Path, producer: Callable[[], Any], *, refresh: bool = False) -> Any:
    """Retourne le contenu de `path`, en appelant `producer()` si besoin."""
    log = get_logger("cache")
    if path.exists() and not refresh:
        log.info("cache HIT  %s", path.relative_to(path.parents[2]))
        return json.loads(path.read_text(encoding="utf-8"))
    log.info("cache MISS %s -> appel API", path.relative_to(path.parents[2]))
    payload = producer()
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def write_raw(source: str, period_key: str, dataset: str, payload: Any) -> Path:
    path = cache_path(source, period_key, dataset)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


# --------------------------------------------------------------------------
# Classification branded / cluster
# --------------------------------------------------------------------------

_STRICT_RE = re.compile("|".join(BRANDED_STRICT_PATTERNS), re.IGNORECASE)
_LARGE_RE = re.compile("|".join(BRANDED_LARGE_PATTERNS), re.IGNORECASE)


def is_branded(query: str, *, definition: str = "strict") -> bool:
    """`definition` vaut 'strict' (marque nue) ou 'large' (marque + gammes)."""
    if not isinstance(query, str):
        return False
    rx = _STRICT_RE if definition == "strict" else _LARGE_RE
    return bool(rx.search(query))


def tag_branded(df: pd.DataFrame, query_col: str = "query") -> pd.DataFrame:
    """Ajoute les colonnes branded_strict / branded_large."""
    out = df.copy()
    out["branded_strict"] = out[query_col].map(lambda q: is_branded(q, definition="strict"))
    out["branded_large"] = out[query_col].map(lambda q: is_branded(q, definition="large"))
    return out


_CLUSTER_RES = {
    name: re.compile("|".join(patterns), re.IGNORECASE)
    for name, patterns in CLUSTERS.items()
}


def assign_cluster(text: str) -> str:
    """Premier cluster dont un motif matche, sinon 'Autre'."""
    if not isinstance(text, str):
        return "Autre"
    for name, rx in _CLUSTER_RES.items():
        if rx.search(text):
            return name
    return "Autre"


# --------------------------------------------------------------------------
# Normalisation
# --------------------------------------------------------------------------

def per_30_days(value: float, period: Period) -> float:
    """Ramene un volume (clics, impressions, leads...) a un equivalent 30 jours.

    Indispensable ici : T0 fait 31 j, T1 77 j, T2 78 j. Comparer les totaux bruts
    donnerait une fausse progression d'un facteur 2,5.
    """
    if period.days == 0:
        return float("nan")
    return value * 30.0 / period.days


def delta(new: float | None, old: float | None) -> dict[str, float | None]:
    """Delta absolu et relatif, robuste aux valeurs manquantes."""
    if new is None or old is None or (isinstance(old, float) and pd.isna(old)):
        return {"abs": None, "pct": None}
    abs_d = new - old
    pct = (abs_d / old * 100.0) if old else None
    return {"abs": abs_d, "pct": pct}


def position_bucket(position: float) -> str:
    if pd.isna(position):
        return "n/d"
    for lo, hi in [(1, 3), (4, 10), (11, 20), (21, 50), (51, 100)]:
        if lo <= position <= hi:
            return f"{lo}-{hi}"
    return ">100"


def save_table(df: pd.DataFrame, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    get_logger("io").info("ecrit %s (%d lignes)", path.name, len(df))
    return path


def run_cli(main: Callable[[], int]) -> None:
    """Enveloppe : transforme les deux echecs courants (credentials absents,
    dependance non installee) en message actionnable plutot qu'en traceback."""
    log = get_logger("cli")
    try:
        sys.exit(main() or 0)
    except MissingCredentials as exc:
        log.error("%s", exc)
        sys.exit(2)
    except ModuleNotFoundError as exc:
        log.error("Dependance manquante : %s\n"
                  "Installer l'environnement : pip install -r requirements.txt",
                  exc.name)
        sys.exit(3)
