"""Extraction Webflow Data API v2 : formulaires et soumissions du site vilber.com.

  export WEBFLOW_TOKEN=...            # token de l'espace Webflow qui heberge vilber.com
  export WEBFLOW_SITE_ID=...          # optionnel : sinon resolu par nom de domaine

Produit dans data/raw/webflow/ :
  - forms.json             : schema de chaque formulaire du site
  - submissions.json       : toutes les soumissions (paginees), horodatees
  - submissions_<periode>  : sous-ensemble par periode du bilan

ATTENTION (verifie le 2026-09-24) : le site Webflow "Vilber" present dans
l'espace Studio Visuweb (id 6901cf424692349e4d2b5192) est une copie de
developpement -- dernier publish 2025-12-10, aucun domaine custom, 0 soumission.
Le token doit donc venir de l'espace Webflow de Vilber lui-meme, sinon ce script
renverra une liste vide sans erreur.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone

from common import get_logger, require_env, resolve_periods, run_cli, write_raw
from config import Period

log = get_logger("webflow")

API = "https://api.webflow.com/v2"
PAGE_SIZE = 100


def _session():
    import requests

    (token,) = require_env("WEBFLOW_TOKEN")
    sess = requests.Session()
    sess.headers.update({"Authorization": f"Bearer {token}",
                         "accept": "application/json"})
    return sess


def resolve_site_id(sess, domain: str = "vilber.com") -> str:
    import os

    if os.environ.get("WEBFLOW_SITE_ID"):
        return os.environ["WEBFLOW_SITE_ID"]
    sites = sess.get(f"{API}/sites", timeout=30).json().get("sites", [])
    for site in sites:
        urls = [d.get("url", "") for d in site.get("customDomains", [])]
        if any(domain in u for u in urls):
            log.info("site resolu : %s (%s)", site.get("displayName"), site["id"])
            return site["id"]
    raise RuntimeError(
        f"Aucun site Webflow accessible ne sert {domain}. "
        "Le token appartient-il bien a l'espace Webflow de Vilber ? "
        "Sites vus : " + ", ".join(s.get("displayName", "?") for s in sites)
    )


def _paginate(sess, url: str, key: str) -> list[dict]:
    items, offset = [], 0
    while True:
        resp = sess.get(url, params={"limit": PAGE_SIZE, "offset": offset}, timeout=60)
        resp.raise_for_status()
        payload = resp.json()
        batch = payload.get(key, [])
        items.extend(batch)
        total = payload.get("pagination", {}).get("total", len(items))
        offset += PAGE_SIZE
        if offset >= total or not batch:
            break
    return items


def _parse_dt(value: str | None):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def extract(periods: list[Period]) -> None:
    sess = _session()
    site_id = resolve_site_id(sess)

    forms = _paginate(sess, f"{API}/sites/{site_id}/forms", "forms")
    write_raw("webflow", "ALL", "forms", {"site_id": site_id, "rows": forms})
    log.info("%d formulaire(s)", len(forms))

    submissions = _paginate(sess, f"{API}/sites/{site_id}/form_submissions", "formSubmissions")
    write_raw("webflow", "ALL", "submissions", {"site_id": site_id, "rows": submissions})
    log.info("%d soumission(s) au total", len(submissions))

    if not submissions:
        log.warning("0 soumission renvoyee. Verifiez que le token couvre bien le "
                    "site de production vilber.com (cf. docstring).")

    form_names = {f["id"]: f.get("displayName", "?") for f in forms}
    for period in periods:
        subset = []
        for sub in submissions:
            dt = _parse_dt(sub.get("dateSubmitted"))
            if dt and period.start <= dt.astimezone(timezone.utc).date() <= period.end:
                subset.append(sub | {"formName": form_names.get(sub.get("formId"), "?")})
        write_raw("webflow", period.key, "submissions",
                  {"meta": period.as_dict(), "rows": subset})
        log.info("%s : %d soumission(s)", period.key, len(subset))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--periods", nargs="*")
    args = parser.parse_args()
    extract(resolve_periods(args.periods))
    return 0


if __name__ == "__main__":
    run_cli(main)
