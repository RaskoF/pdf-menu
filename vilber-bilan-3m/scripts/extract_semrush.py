"""Extraction SEMrush (Analytics API v3) pour le bilan Vilber.

Deux modes :
  1. API  : export SEMRUSH_API_KEY=...   (endpoints domain_ranks, domain_organic,
            backlinks_overview, domain_organic_organic pour les concurrents)
  2. CSV  : si pas de cle, depose les exports manuels dans
            data/raw/semrush/manual/ et relance avec --from-csv.
            Nommage attendu : <periode>__<dataset>.csv
            ex. T2__domain_organic.csv, T2__backlinks_overview.csv

SEMrush n'expose pas d'historique a la journee sur les plans standard : les
donnees sont mensuelles. Les periodes T0/T1/T2 sont donc mappees sur les mois
qu'elles recouvrent, et le rapport doit le dire explicitement.
"""

from __future__ import annotations

import argparse
import csv
import io
from pathlib import Path

from common import cache_path, get_logger, require_env, resolve_periods, run_cli, write_raw
from config import COMPETITORS, DATA_RAW, SEMRUSH_DOMAIN, Period

log = get_logger("semrush")

API_ROOT = "https://api.semrush.com/"
MANUAL_DIR = DATA_RAW / "semrush" / "manual"

REPORTS = {
    "domain_ranks": {
        "type": "domain_ranks",
        "export_columns": "Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac",
    },
    "domain_organic": {
        "type": "domain_organic",
        "export_columns": "Ph,Po,Pp,Pd,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td",
        "display_limit": 1000,
        "display_sort": "tr_desc",
    },
    "backlinks_overview": {
        "type": "backlinks_overview",
        "export_columns": "ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num",
        "target_type": "root_domain",
    },
}


def months_covered(period: Period) -> list[str]:
    """Liste des mois YYYYMM15 (format SEMrush display_date) couverts."""
    out, y, m = [], period.start.year, period.start.month
    while (y, m) <= (period.end.year, period.end.month):
        out.append(f"{y}{m:02d}15")
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return out


def _call(params: dict) -> list[dict]:
    import requests

    (key,) = require_env("SEMRUSH_API_KEY")
    params = {"key": key, "database": "us", **params}
    resp = requests.get(API_ROOT, params=params, timeout=60)
    resp.raise_for_status()
    text = resp.text.strip()
    if text.startswith("ERROR"):
        raise RuntimeError(f"SEMrush: {text}")
    return list(csv.DictReader(io.StringIO(text), delimiter=";"))


def extract_api(periods: list[Period], refresh: bool = False) -> None:
    for period in periods:
        for month in months_covered(period):
            for name, base in REPORTS.items():
                path = cache_path("semrush", f"{period.key}_{month}", name)
                if path.exists() and not refresh:
                    log.info("cache HIT  %s/%s", period.key, name)
                    continue
                params = dict(base)
                params["domain" if "domain" in name else "target"] = SEMRUSH_DOMAIN
                params["display_date"] = month
                rows = _call(params)
                write_raw("semrush", f"{period.key}_{month}", name,
                          {"meta": period.as_dict() | {"month": month}, "rows": rows})

        # Comparaison concurrentielle : positions organiques des concurrents.
        for competitor in COMPETITORS:
            path = cache_path("semrush", period.key, f"competitor_{competitor}")
            if path.exists() and not refresh:
                continue
            params = dict(REPORTS["domain_organic"])
            params["domain"] = competitor
            params["display_date"] = months_covered(period)[-1]
            write_raw("semrush", period.key, f"competitor_{competitor}",
                      {"meta": {"competitor": competitor} | period.as_dict(),
                       "rows": _call(params)})


def extract_csv(periods: list[Period]) -> None:
    """Reprend les exports manuels deposes dans data/raw/semrush/manual/."""
    MANUAL_DIR.mkdir(parents=True, exist_ok=True)
    found = sorted(MANUAL_DIR.glob("*.csv"))
    if not found:
        log.warning("Aucun CSV dans %s. Exportez depuis l'interface SEMrush "
                    "(Domain Overview, Organic Research, Backlinks) et nommez "
                    "les fichiers <periode>__<dataset>.csv", MANUAL_DIR)
        return
    for path in found:
        stem = path.stem
        if "__" not in stem:
            log.warning("ignore %s (nommage attendu <periode>__<dataset>.csv)", path.name)
            continue
        period_key, dataset = stem.split("__", 1)
        with path.open(encoding="utf-8-sig", newline="") as fh:
            sample = fh.read(4096)
            fh.seek(0)
            delim = ";" if sample.count(";") > sample.count(",") else ","
            rows = list(csv.DictReader(fh, delimiter=delim))
        write_raw("semrush", period_key, dataset,
                  {"meta": {"source": "export manuel", "fichier": path.name}, "rows": rows})
        log.info("importe %s (%d lignes)", path.name, len(rows))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--periods", nargs="*")
    parser.add_argument("--from-csv", action="store_true",
                        help="reprend les exports manuels au lieu d'appeler l'API")
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    periods = resolve_periods(args.periods)
    if args.from_csv:
        extract_csv(periods)
    else:
        extract_api(periods, refresh=args.refresh)
    return 0


if __name__ == "__main__":
    run_cli(main)
