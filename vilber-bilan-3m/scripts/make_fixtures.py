"""Genere des donnees FICTIVES au format des APIs, pour tester la chaine.

Sert uniquement a verifier que consolidate.py et le notebook tournent avant
d'avoir les credentials. Chaque fichier produit porte "fixture": true dans son
meta, et consolidate.py recopie ce marqueur -- aucun chiffre issu d'une fixture
ne doit finir dans le rapport client.

  python scripts/make_fixtures.py --out data/raw_fixtures
  DATA_RAW_OVERRIDE=data/raw_fixtures python scripts/consolidate.py
"""

from __future__ import annotations

import argparse
import json
import random
from datetime import timedelta
from pathlib import Path

from config import PERIODS

QUERIES = [
    ("vilber", 0.30), ("vilber lourmat", 0.12), ("vilber fusion fx", 0.05),
    ("vilber gel doc", 0.04), ("fusion absolute", 0.03), ("newton 7.0", 0.02),
    ("western blot imager", 0.03), ("western blot troubleshooting", 0.04),
    ("gel documentation system", 0.05), ("uv radiometer", 0.03),
    ("uv irradiator", 0.03), ("in vivo imaging system", 0.04),
    ("nir-ii imaging", 0.05), ("chemiluminescence imaging", 0.03),
    ("imagej western blot quantification", 0.04), ("x-ray tomography preclinical", 0.03),
    ("uv sterilization chamber", 0.02), ("bioluminescence imaging", 0.02),
    ("fluorescent western blot", 0.02), ("gel doc system price", 0.01),
]

PAGES = [
    "/", "/systems/fusion-absolute", "/systems/e-box", "/systems/newton",
    "/uv-instrument/uv-lamps", "/uv-instrument/uv-irradiators",
    "/uv-instrument/uv-tubes", "/uv-instrument/uv-radiometers",
    "/articles/western-blot-troubleshooting", "/articles/when-to-use-nir-ii",
]


def build(period_key: str, seed: int, volume: int) -> dict[str, dict]:
    rng = random.Random(seed)
    period = PERIODS[period_key]

    queries = []
    for query, share in QUERIES:
        clicks = max(0, int(volume * share * rng.uniform(0.7, 1.3)))
        impressions = max(clicks, int(clicks * rng.uniform(4, 60)))
        queries.append({
            "keys": [query],
            "clicks": clicks,
            "impressions": impressions,
            "ctr": clicks / impressions if impressions else 0,
            "position": round(rng.uniform(1.5, 28.0), 1),
        })

    pages = []
    for page in PAGES:
        clicks = max(0, int(volume * rng.uniform(0.01, 0.25)))
        impressions = max(clicks, int(clicks * rng.uniform(4, 40)))
        pages.append({
            "keys": [f"https://vilber.com{page}"],
            "clicks": clicks, "impressions": impressions,
            "ctr": clicks / impressions if impressions else 0,
            "position": round(rng.uniform(2.0, 20.0), 1),
        })

    dates = []
    day = period.start
    while day <= period.end:
        clicks = int(volume / period.days * rng.uniform(0.6, 1.4))
        dates.append({
            "keys": [day.isoformat()], "clicks": clicks,
            "impressions": clicks * rng.randint(6, 20),
            "ctr": rng.uniform(0.04, 0.14), "position": round(rng.uniform(5, 12), 1),
        })
        day += timedelta(days=1)

    total_clicks = sum(q["clicks"] for q in queries)
    total_impr = sum(q["impressions"] for q in queries)
    totals = [{
        "keys": [], "clicks": total_clicks, "impressions": total_impr,
        "ctr": total_clicks / total_impr if total_impr else 0,
        "position": round(sum(q["position"] for q in queries) / len(queries), 1),
    }]

    meta = period.as_dict() | {"fixture": True}
    return {
        "queries": {"meta": meta, "rows": queries},
        "pages": {"meta": meta, "rows": pages},
        "dates": {"meta": meta, "rows": dates},
        "totals": {"meta": meta, "rows": totals},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="data/raw_fixtures")
    args = parser.parse_args()

    out = Path(args.out) / "search_console"
    out.mkdir(parents=True, exist_ok=True)
    plan = {"T0": (1, 1800), "T1": (2, 4200), "T2": (3, 4900), "GLOBAL": (4, 9100)}
    for period_key, (seed, volume) in plan.items():
        for dataset, payload in build(period_key, seed, volume).items():
            path = out / f"{period_key}__{dataset}.json"
            path.write_text(json.dumps(payload, ensure_ascii=False, indent=2),
                            encoding="utf-8")
    print(f"Fixtures ecrites dans {out} — DONNEES FICTIVES, ne pas publier.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
