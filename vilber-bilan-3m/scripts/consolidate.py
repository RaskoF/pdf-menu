"""Consolidation des extractions brutes en DataFrames exploitables.

Lit data/raw/<source>/<periode>__<dataset>.json et ecrit dans
data/consolidated/ :

  gsc_queries.csv        requete x periode (+ branded strict/large, cluster)
  gsc_pages.csv          page x periode (+ cluster, money page)
  gsc_daily.csv          serie quotidienne
  gsc_totals.csv         totaux par periode (bruts + normalises 30 j)
  gsc_position_mix.csv   impressions par tranche de position
  branded_share.csv      part des clics branded, selon les deux definitions
  ga4_overview.csv       metriques d'audience par periode
  ga4_channels.csv       sessions par canal
  ga4_conversions.csv    evenements de conversion par periode et par source
  clarity_metrics.csv    metriques d'engagement Clarity
  webflow_leads.csv      soumissions de formulaire par periode et formulaire
  kpis_synthese.csv      les KPIs strategiques, T0 / T1 / T2 + cibles
  deltas.csv             T0->T1, T1->T2, T0->T2 pour chaque KPI
  bilan.json             tout ce qui precede, en un seul objet structure
  manifest.json          ce qui a ete trouve, ce qui manque

Le script ne plante pas sur une source absente : il la signale dans le manifest
et poursuit. Lancer `python scripts/consolidate.py` a tout moment donne donc un
etat des lieux de ce qui reste a collecter.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import pandas as pd

from common import assign_cluster, get_logger, per_30_days, position_bucket, resolve_periods, save_table, tag_branded
from config import (
    DATA_CONSOLIDATED,
    DATA_RAW,
    DATA_REFERENCE,
    MONEY_PAGES,
    PERIODS,
    Period,
)

log = get_logger("consolidate")

MANIFEST: dict[str, Any] = {"trouve": [], "manquant": [], "notes": []}


# --------------------------------------------------------------------------
# Lecture des fichiers bruts
# --------------------------------------------------------------------------

def load_raw(source: str, period_key: str, dataset: str) -> dict | None:
    path = DATA_RAW / source / f"{period_key}__{dataset}.json"
    ref = f"{source}/{period_key}/{dataset}"
    if not path.exists():
        MANIFEST["manquant"].append(ref)
        return None
    MANIFEST["trouve"].append(ref)
    return json.loads(path.read_text(encoding="utf-8"))


def _gsc_rows(payload: dict, dimensions: list[str]) -> pd.DataFrame:
    """Convertit la reponse Search Analytics en DataFrame."""
    rows = payload.get("rows", [])
    records = []
    for row in rows:
        record = dict(zip(dimensions, row.get("keys", []))) if dimensions else {}
        record |= {
            "clicks": row.get("clicks", 0),
            "impressions": row.get("impressions", 0),
            "ctr": row.get("ctr", 0.0),
            "position": row.get("position", float("nan")),
        }
        records.append(record)
    return pd.DataFrame(records)


# --------------------------------------------------------------------------
# Search Console
# --------------------------------------------------------------------------

def build_gsc(periods: list[Period]) -> dict[str, pd.DataFrame]:
    queries, pages, daily, totals = [], [], [], []

    for period in periods:
        payload = load_raw("search_console", period.key, "queries")
        if payload:
            df = _gsc_rows(payload, ["query"])
            if not df.empty:
                df = tag_branded(df, "query")
                df["cluster"] = df["query"].map(assign_cluster)
                df["periode"] = period.key
                queries.append(df)

        payload = load_raw("search_console", period.key, "pages")
        if payload:
            df = _gsc_rows(payload, ["page"])
            if not df.empty:
                df["path"] = df["page"].str.replace(r"^https?://[^/]+", "", regex=True)
                df["money_page"] = df["path"].map(lambda p: MONEY_PAGES.get(p.rstrip("/") or "/"))
                df["cluster"] = df["path"].map(assign_cluster)
                df["periode"] = period.key
                pages.append(df)

        payload = load_raw("search_console", period.key, "dates")
        if payload:
            df = _gsc_rows(payload, ["date"])
            if not df.empty:
                df["date"] = pd.to_datetime(df["date"])
                df["periode"] = period.key
                daily.append(df)

        payload = load_raw("search_console", period.key, "totals")
        if payload:
            df = _gsc_rows(payload, [])
            if not df.empty:
                row = df.iloc[0].to_dict()
                row |= {
                    "periode": period.key,
                    "label": period.label,
                    "debut": period.start.isoformat(),
                    "fin": period.end.isoformat(),
                    "jours": period.days,
                    "clicks_30j": per_30_days(row["clicks"], period),
                    "impressions_30j": per_30_days(row["impressions"], period),
                    "ctr_pct": row["ctr"] * 100,
                }
                totals.append(row)

    out = {
        "gsc_queries": pd.concat(queries, ignore_index=True) if queries else pd.DataFrame(),
        "gsc_pages": pd.concat(pages, ignore_index=True) if pages else pd.DataFrame(),
        "gsc_daily": pd.concat(daily, ignore_index=True) if daily else pd.DataFrame(),
        "gsc_totals": pd.DataFrame(totals),
    }

    # Mix de positions : impressions par tranche.
    if not out["gsc_queries"].empty:
        q = out["gsc_queries"].copy()
        q["tranche"] = q["position"].map(position_bucket)
        mix = (q.groupby(["periode", "tranche"], as_index=False)
                 .agg(impressions=("impressions", "sum"), clics=("clicks", "sum"),
                      requetes=("query", "nunique")))
        mix["part_impressions_pct"] = (
            mix["impressions"] / mix.groupby("periode")["impressions"].transform("sum") * 100
        )
        out["gsc_position_mix"] = mix
    else:
        out["gsc_position_mix"] = pd.DataFrame()

    return out


def build_branded_share(gsc_queries: pd.DataFrame) -> pd.DataFrame:
    """Part des clics de marque, selon les deux definitions concurrentes.

    strict = 'vilber'/'lourmat' seuls  (definition de la base KPIs Notion : 27,2 %)
    large  = marque + gammes produit   (definition de la strategie M3 : 70 %)
    """
    if gsc_queries.empty:
        return pd.DataFrame()
    rows = []
    for periode, grp in gsc_queries.groupby("periode"):
        total = grp["clicks"].sum()
        if not total:
            continue
        for definition in ("strict", "large"):
            col = f"branded_{definition}"
            branded = grp.loc[grp[col], "clicks"].sum()
            rows.append({
                "periode": periode,
                "definition": definition,
                "clics_total": int(total),
                "clics_branded": int(branded),
                "clics_non_branded": int(total - branded),
                "part_branded_pct": round(branded / total * 100, 2),
            })
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------
# GA4
# --------------------------------------------------------------------------

def _ga4_frame(payload: dict | None, period: Period) -> pd.DataFrame:
    if not payload or not payload.get("rows"):
        return pd.DataFrame()
    df = pd.DataFrame(payload["rows"])
    for col in df.columns:
        converted = pd.to_numeric(df[col], errors="coerce")
        if converted.notna().all():
            df[col] = converted
    df["periode"] = period.key
    return df


def build_ga4(periods: list[Period]) -> dict[str, pd.DataFrame]:
    buckets: dict[str, list[pd.DataFrame]] = {
        "ga4_overview": [], "ga4_channels": [], "ga4_conversions": [],
        "ga4_pages": [], "ga4_source_medium": [], "ga4_daily": [],
    }
    mapping = {
        "ga4_overview": "overview", "ga4_channels": "channels",
        "ga4_conversions": "conversion_src", "ga4_pages": "pages",
        "ga4_source_medium": "source_medium", "ga4_daily": "daily",
    }
    for period in periods:
        for name, dataset in mapping.items():
            df = _ga4_frame(load_raw("ga4", period.key, dataset), period)
            if not df.empty:
                buckets[name].append(df)

    out = {k: (pd.concat(v, ignore_index=True) if v else pd.DataFrame())
           for k, v in buckets.items()}

    # Duree d'engagement moyenne par session, en secondes.
    ov = out["ga4_overview"]
    if not ov.empty and {"userEngagementDuration", "sessions"} <= set(ov.columns):
        ov["duree_engagement_par_session_s"] = (
            ov["userEngagementDuration"] / ov["sessions"].replace(0, pd.NA)
        )
        out["ga4_overview"] = ov
    return out


# --------------------------------------------------------------------------
# Clarity / Webflow
# --------------------------------------------------------------------------

def build_clarity(periods: list[Period]) -> pd.DataFrame:
    frames = []
    for period in periods:
        payload = load_raw("clarity", period.key, "metrics")
        if payload and payload.get("rows"):
            df = pd.DataFrame(payload["rows"])
            df["periode"] = period.key
            frames.append(df)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


def build_webflow(periods: list[Period]) -> pd.DataFrame:
    rows = []
    for period in periods:
        payload = load_raw("webflow", period.key, "submissions")
        if not payload:
            continue
        subs = payload.get("rows", [])
        if not subs:
            rows.append({"periode": period.key, "formulaire": "(aucune)",
                         "soumissions": 0, "soumissions_30j": 0.0})
            continue
        df = pd.DataFrame(subs)
        grouped = df.groupby(df.get("formName", "?")).size()
        for form, count in grouped.items():
            rows.append({
                "periode": period.key,
                "formulaire": form,
                "soumissions": int(count),
                "soumissions_30j": round(per_30_days(count, period), 1),
            })
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------
# Synthese KPI + deltas
# --------------------------------------------------------------------------

KPI_SPECS = [
    # (nom du KPI, source, comment l'extraire)
    ("Clics organiques / 30 j", "gsc_totals", "clicks_30j"),
    ("Impressions / 30 j", "gsc_totals", "impressions_30j"),
    ("CTR moyen (%)", "gsc_totals", "ctr_pct"),
    ("Position moyenne", "gsc_totals", "position"),
    ("Sessions GA4", "ga4_overview", "sessions"),
    ("Utilisateurs actifs GA4", "ga4_overview", "activeUsers"),
    ("Duree d'engagement / session (s)", "ga4_overview", "duree_engagement_par_session_s"),
    ("Taux d'engagement GA4", "ga4_overview", "engagementRate"),
]


def build_kpis(tables: dict[str, pd.DataFrame]) -> pd.DataFrame:
    rows = []
    for kpi, table_name, column in KPI_SPECS:
        table = tables.get(table_name, pd.DataFrame())
        if table.empty or column not in table.columns:
            MANIFEST["notes"].append(f"KPI non calculable : {kpi} (manque {table_name}.{column})")
            continue
        for periode, grp in table.groupby("periode"):
            rows.append({"kpi": kpi, "periode": periode,
                         "valeur": float(grp[column].iloc[0])})

    branded = tables.get("branded_share", pd.DataFrame())
    if not branded.empty:
        for _, row in branded.iterrows():
            rows.append({
                "kpi": f"% clics branded ({row['definition']})",
                "periode": row["periode"],
                "valeur": float(row["part_branded_pct"]),
            })

    if not rows:
        return pd.DataFrame(columns=["kpi", "periode", "valeur"])
    return pd.DataFrame(rows).pivot_table(index="kpi", columns="periode",
                                          values="valeur").reset_index()


def build_deltas(kpis: pd.DataFrame) -> pd.DataFrame:
    if kpis.empty:
        return pd.DataFrame()
    pairs = [("T0", "T1"), ("T1", "T2"), ("T0", "T2")]
    rows = []
    for _, row in kpis.iterrows():
        for old, new in pairs:
            if old not in kpis.columns or new not in kpis.columns:
                continue
            o, n = row.get(old), row.get(new)
            if pd.isna(o) or pd.isna(n):
                continue
            rows.append({
                "kpi": row["kpi"],
                "comparaison": f"{old} -> {new}",
                "depart": round(float(o), 2),
                "arrivee": round(float(n), 2),
                "delta_abs": round(float(n - o), 2),
                "delta_pct": round(float((n - o) / o * 100), 1) if o else None,
            })
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------
# Orchestration
# --------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--periods", nargs="*")
    args = parser.parse_args()
    periods = resolve_periods(args.periods)

    tables: dict[str, pd.DataFrame] = {}
    tables |= build_gsc(periods)
    tables["branded_share"] = build_branded_share(tables["gsc_queries"])
    tables |= build_ga4(periods)
    tables["clarity_metrics"] = build_clarity(periods)
    tables["webflow_leads"] = build_webflow(periods)
    tables["kpis_synthese"] = build_kpis(tables)
    tables["deltas"] = build_deltas(tables["kpis_synthese"])

    for name, df in tables.items():
        if df.empty:
            log.warning("table vide : %s", name)
            continue
        save_table(df, DATA_CONSOLIDATED / f"{name}.csv")

    bilan = {
        "periodes": {k: PERIODS[k].as_dict() for k in [p.key for p in periods]},
        "tables": {name: json.loads(df.to_json(orient="records", date_format="iso"))
                   for name, df in tables.items() if not df.empty},
        "references": {
            path.stem: json.loads(path.read_text(encoding="utf-8"))
            for path in sorted(DATA_REFERENCE.glob("*.json"))
        },
    }
    (DATA_CONSOLIDATED / "bilan.json").write_text(
        json.dumps(bilan, ensure_ascii=False, indent=2), encoding="utf-8")

    MANIFEST["resume"] = {
        "sources_trouvees": len(MANIFEST["trouve"]),
        "sources_manquantes": len(MANIFEST["manquant"]),
        "tables_produites": sorted(n for n, d in tables.items() if not d.empty),
    }
    (DATA_CONSOLIDATED / "manifest.json").write_text(
        json.dumps(MANIFEST, ensure_ascii=False, indent=2), encoding="utf-8")

    log.info("Consolidation terminee : %d source(s) presente(s), %d manquante(s).",
             len(MANIFEST["trouve"]), len(MANIFEST["manquant"]))
    if MANIFEST["manquant"]:
        log.info("Detail des manques : data/consolidated/manifest.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
