"""Extraction Google Analytics 4 (Data API v1beta) pour le bilan Vilber.

Produit par periode, dans data/raw/ga4/ :
  - overview        : utilisateurs, sessions, duree d'engagement, taux d'engagement
  - channels        : sessions par sessionDefaultChannelGroup (organique vs autres)
  - source_medium   : sessions par source/medium (detection du bruit Direct/bot)
  - pages           : vues + sessions engagees par page
  - conversions     : evenements de conversion par nom d'evenement
  - conversion_src  : conversions x premiere source utilisateur
  - daily           : serie quotidienne sessions/utilisateurs (anomalies)

Auth : compte de service avec acces Lecture sur la propriete.
  export GA4_CREDENTIALS=/chemin/vers/service-account.json
  export GA4_PROPERTY_ID=123456789

IMPORTANT (cf. docs/ECARTS-BRIEF.md, point 5) : le rapport #1 montre que les
conversions Vilber sont portees par l'evenement `contact_submitted` (41 sur 42),
`demo_requested` n'en pesant qu'une seule. Ne pas reduire l'analyse leads au
seul formulaire /get-a-demo.
"""

from __future__ import annotations

import argparse
from typing import Any

from common import cache_path, cached_json, get_logger, require_env, resolve_periods, run_cli
from config import GA4_PROPERTY_ID, Period

log = get_logger("ga4")

CONVERSION_EVENTS = ["contact_submitted", "demo_requested", "generate_lead", "form_submission"]


def _client():
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.oauth2 import service_account

    (cred_path,) = require_env("GA4_CREDENTIALS")
    creds = service_account.Credentials.from_service_account_file(
        cred_path, scopes=["https://www.googleapis.com/auth/analytics.readonly"]
    )
    return BetaAnalyticsDataClient(credentials=creds)


def _property_id() -> str:
    if GA4_PROPERTY_ID:
        return GA4_PROPERTY_ID
    (pid,) = require_env("GA4_PROPERTY_ID")
    return pid


def _run_report(client, period: Period, dimensions: list[str], metrics: list[str],
                limit: int = 100_000) -> list[dict[str, Any]]:
    from google.analytics.data_v1beta.types import (
        DateRange, Dimension, Metric, RunReportRequest,
    )

    request = RunReportRequest(
        property=f"properties/{_property_id()}",
        date_ranges=[DateRange(start_date=period.start.isoformat(),
                               end_date=period.end.isoformat())],
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name=m) for m in metrics],
        limit=limit,
    )
    response = client.run_report(request)
    rows = []
    for row in response.rows:
        record = {d: v.value for d, v in zip(dimensions, row.dimension_values)}
        record |= {m: v.value for m, v in zip(metrics, row.metric_values)}
        rows.append(record)
    return rows


CORE_METRICS = [
    "activeUsers", "newUsers", "sessions", "engagedSessions",
    "averageSessionDuration", "userEngagementDuration", "engagementRate",
    "screenPageViews", "eventCount",
]

DATASETS: dict[str, tuple[list[str], list[str]]] = {
    "overview":       ([], CORE_METRICS),
    "channels":       (["sessionDefaultChannelGroup"], CORE_METRICS),
    "source_medium":  (["sessionSource", "sessionMedium"], ["sessions", "activeUsers", "engagementRate"]),
    "pages":          (["pagePath"], ["screenPageViews", "sessions", "engagedSessions", "userEngagementDuration"]),
    "conversions":    (["eventName"], ["eventCount"]),
    "conversion_src": (["eventName", "firstUserSource", "firstUserMedium"], ["eventCount"]),
    "landing_pages":  (["landingPage"], ["sessions", "engagedSessions"]),
    "daily":          (["date"], ["sessions", "activeUsers", "userEngagementDuration"]),
}


def extract(periods: list[Period], refresh: bool = False) -> None:
    client = None
    for period in periods:
        for dataset, (dims, metrics) in DATASETS.items():
            path = cache_path("ga4", period.key, dataset)
            if path.exists() and not refresh:
                log.info("cache HIT  %s/%s", period.key, dataset)
                continue
            if client is None:
                client = _client()

            def producer(dims=dims, metrics=metrics, period=period):
                return {
                    "meta": period.as_dict() | {"dimensions": dims, "metrics": metrics},
                    "rows": _run_report(client, period, dims, metrics),
                }

            cached_json(path, producer, refresh=refresh)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--periods", nargs="*")
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    periods = resolve_periods(args.periods)
    log.info("Extraction GA4 sur %d periode(s)", len(periods))
    extract(periods, refresh=args.refresh)
    return 0


if __name__ == "__main__":
    run_cli(main)
