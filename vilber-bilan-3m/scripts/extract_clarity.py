"""Ingestion Microsoft Clarity pour le bilan Vilber.

Clarity n'expose pas d'API historique utilisable ici : la Data Export API ne
couvre que les 3 derniers jours et plafonne a 10 appels/jour. Les periodes T0 et
T1 sont donc forcement reprises d'exports manuels.

Deux entrees :
  1. Exports CSV manuels  -> data/raw/clarity/manual/<periode>__<dataset>.csv
     Datasets attendus : metrics, pages, heatmaps, recordings
  2. Data Export API (optionnelle, pour le jour le jour a partir de maintenant)
     export CLARITY_API_TOKEN=...

Metriques suivies : sessions, duree moyenne, pages/session, scroll depth moyen,
dead clicks %, rage clicks %, quick backs %.
Repere du rapport #1 (26/05 -> 24/06) : scroll depth 54,91 %, dead clicks 8,03 %,
rage clicks 0,16 %, quick backs 5,95 %.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from common import get_logger, require_env, resolve_periods, run_cli, write_raw
from config import DATA_RAW, Period

log = get_logger("clarity")

MANUAL_DIR = DATA_RAW / "clarity" / "manual"
API_URL = "https://www.clarity.ms/export-data/api/v1/project-live-insights"

EXPECTED = ["metrics", "pages", "heatmaps", "recordings"]


def import_manual(periods: list[Period]) -> None:
    MANUAL_DIR.mkdir(parents=True, exist_ok=True)
    wanted = {p.key for p in periods}
    files = sorted(MANUAL_DIR.glob("*.csv"))
    if not files:
        log.warning(
            "Aucun export Clarity dans %s.\n"
            "  Dans Clarity : Dashboard > filtre de dates > Export.\n"
            "  Nommer les fichiers <periode>__<dataset>.csv, ex. T2__metrics.csv\n"
            "  Datasets attendus : %s", MANUAL_DIR, ", ".join(EXPECTED))
        return
    for path in files:
        if "__" not in path.stem:
            log.warning("ignore %s (nommage <periode>__<dataset>.csv)", path.name)
            continue
        period_key, dataset = path.stem.split("__", 1)
        if period_key not in wanted:
            continue
        with path.open(encoding="utf-8-sig", newline="") as fh:
            sample = fh.read(4096)
            fh.seek(0)
            delim = ";" if sample.count(";") > sample.count(",") else ","
            rows = list(csv.DictReader(fh, delimiter=delim))
        write_raw("clarity", period_key, dataset,
                  {"meta": {"source": "export manuel Clarity", "fichier": path.name}, "rows": rows})
        log.info("importe %s (%d lignes)", path.name, len(rows))

    for period in periods:
        manquants = [d for d in EXPECTED
                     if not (MANUAL_DIR / f"{period.key}__{d}.csv").exists()]
        if manquants:
            log.warning("%s : datasets Clarity manquants -> %s",
                        period.key, ", ".join(manquants))


def fetch_live(num_of_days: int = 3) -> None:
    """Data Export API : uniquement les 3 derniers jours, 10 appels/jour max."""
    import requests

    (token,) = require_env("CLARITY_API_TOKEN")
    resp = requests.get(
        API_URL,
        headers={"Authorization": f"Bearer {token}"},
        params={"numOfDays": num_of_days},
        timeout=60,
    )
    resp.raise_for_status()
    write_raw("clarity", "LIVE", f"last_{num_of_days}d", resp.json())
    log.info("Clarity live (%d j) enregistre.", num_of_days)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--periods", nargs="*")
    parser.add_argument("--live", action="store_true",
                        help="appelle la Data Export API (3 derniers jours)")
    args = parser.parse_args()
    if args.live:
        fetch_live()
    import_manual(resolve_periods(args.periods))
    return 0


if __name__ == "__main__":
    run_cli(main)
