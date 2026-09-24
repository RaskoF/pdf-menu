"""Extraction Google Search Console pour les periodes du bilan Vilber.

Produit, par periode et dans data/raw/search_console/ :
  - totals        : clics, impressions, CTR, position moyenne
  - queries       : toutes les requetes (pagination 25k/appel)
  - pages         : toutes les pages
  - countries     : repartition pays
  - devices       : repartition appareils
  - dates         : serie quotidienne (pour les courbes et la detection d'anomalies)

Auth : OAuth utilisateur (fichier client_secret JSON) ou compte de service.
  export GSC_CREDENTIALS=/chemin/vers/credentials.json
  export GSC_SITE_URL="sc-domain:vilber.com"   # ou "https://vilber.com/"

Usage :
  python scripts/extract_search_console.py                 # toutes les periodes
  python scripts/extract_search_console.py --periods T2    # une seule
  python scripts/extract_search_console.py --refresh       # ignore le cache
"""

from __future__ import annotations

import argparse
import os
from typing import Any

from common import cache_path, cached_json, get_logger, require_env, resolve_periods, run_cli
from config import SITE_URL, Period

log = get_logger("gsc")

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
ROW_LIMIT = 25_000


def _build_service():
    """Construit le client Search Console. Import tardif : le script doit
    pouvoir s'auto-documenter (--help) sans les dependances Google."""
    from google.oauth2 import service_account
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    (cred_path,) = require_env("GSC_CREDENTIALS")
    token_path = os.environ.get("GSC_TOKEN", str(cache_path("search_console", "_", "token")))

    import json
    raw = json.loads(open(cred_path, encoding="utf-8").read())

    if raw.get("type") == "service_account":
        creds = service_account.Credentials.from_service_account_file(cred_path, scopes=SCOPES)
    elif os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    else:
        flow = InstalledAppFlow.from_client_secrets_file(cred_path, SCOPES)
        creds = flow.run_local_server(port=0)
        open(token_path, "w", encoding="utf-8").write(creds.to_json())

    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def _query_all(service, period: Period, dimensions: list[str]) -> list[dict[str, Any]]:
    """Requete paginee sur l'API Search Analytics."""
    rows: list[dict[str, Any]] = []
    start = 0
    while True:
        body = {
            "startDate": period.start.isoformat(),
            "endDate": period.end.isoformat(),
            "dimensions": dimensions,
            "rowLimit": ROW_LIMIT,
            "startRow": start,
            "dataState": "final",
        }
        resp = service.searchanalytics().query(siteUrl=SITE_URL, body=body).execute()
        batch = resp.get("rows", [])
        rows.extend(batch)
        if len(batch) < ROW_LIMIT:
            break
        start += ROW_LIMIT
        log.info("  %s / %s : %d lignes cumulees", period.key, dimensions, len(rows))
    return rows


DATASETS = {
    "totals": [],
    "queries": ["query"],
    "pages": ["page"],
    "query_page": ["query", "page"],
    "countries": ["country"],
    "devices": ["device"],
    "dates": ["date"],
}


def extract(periods: list[Period], refresh: bool = False) -> None:
    service = None
    for period in periods:
        for dataset, dims in DATASETS.items():
            path = cache_path("search_console", period.key, dataset)
            if path.exists() and not refresh:
                log.info("cache HIT  %s/%s", period.key, dataset)
                continue
            if service is None:
                service = _build_service()

            def producer(dims=dims, period=period):
                return {
                    "meta": period.as_dict() | {"dimensions": dims, "site": SITE_URL},
                    "rows": _query_all(service, period, dims),
                }

            cached_json(path, producer, refresh=refresh)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--periods", nargs="*", help="cles de periode (defaut : toutes)")
    parser.add_argument("--refresh", action="store_true", help="ignore le cache local")
    args = parser.parse_args()

    periods = resolve_periods(args.periods)
    log.info("Extraction GSC de %s sur %d periode(s)", SITE_URL, len(periods))
    extract(periods, refresh=args.refresh)
    log.info("Termine. Donnees brutes dans data/raw/search_console/")
    return 0


if __name__ == "__main__":
    run_cli(main)
