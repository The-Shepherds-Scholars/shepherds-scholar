"""Warm and refresh the API.Bible passage cache. Run once a day.

    python -m app.jobs.refresh_passage_cache

What it does, in order:
  1. Deletes cache rows older than cache_max_age_days (API.Bible's 30-day rule).
  2. Finds passages linked to any event or claim that are missing from the
     cache, or older than cache_refresh_after_days, for each enabled
     API.Bible translation. Oldest first.
  3. Fetches them until the monthly budget runs out.

Monthly cost is roughly (linked passages x API.Bible translations), spread
over the refresh window, however many people use the app.
"""

import logging
from dataclasses import dataclass, field

from sqlalchemy import Connection, text

from app.core.config import get_settings
from app.services.api_bible import ApiBibleClient, ApiBibleError, BudgetExhausted, UnsupportedReference
from app.services.scripture import ref_from_row
from app.services.versification import convert

log = logging.getLogger(__name__)


@dataclass
class RefreshReport:
    purged: int = 0
    fetched: int = 0
    skipped_unsupported: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)
    stopped_for_budget: bool = False


DUE_SQL = """
WITH linked AS (
    SELECT passage_id FROM event_passages
    UNION
    SELECT passage_id FROM claim_passages
)
SELECT sp.*, t.code AS tr_code, t.api_bible_id, t.versification AS tr_versification
FROM linked l
JOIN scripture_passages sp ON sp.id = l.passage_id
CROSS JOIN bible_translations t
LEFT JOIN passage_cache pc ON pc.passage_id = sp.id AND pc.translation_code = t.code
WHERE t.source = 'api_bible' AND t.enabled
  AND (pc.fetched_at IS NULL OR pc.fetched_at < now() - make_interval(days => :refresh_days))
ORDER BY pc.fetched_at NULLS FIRST, sp.canonical_reference
"""

UPSERT_SQL = """
INSERT INTO passage_cache (passage_id, translation_code, reference_label, content, copyright, fums_token, fetched_at)
VALUES (:pid, :tr, :label, :content, :copyright, :fums, now())
ON CONFLICT (passage_id, translation_code) DO UPDATE
SET reference_label = EXCLUDED.reference_label, content = EXCLUDED.content,
    copyright = EXCLUDED.copyright, fums_token = EXCLUDED.fums_token, fetched_at = now()
"""


def refresh(conn: Connection, client: ApiBibleClient) -> RefreshReport:
    settings = get_settings()
    report = RefreshReport()

    report.purged = conn.execute(
        text("DELETE FROM passage_cache WHERE fetched_at < now() - make_interval(days => :d)"),
        {"d": settings.cache_max_age_days},
    ).rowcount

    due = conn.execute(text(DUE_SQL), {"refresh_days": settings.cache_refresh_after_days}).all()
    for row in due:
        label = f"{row.canonical_reference} [{row.tr_code}]"
        ref = convert(ref_from_row(row), row.versification, row.tr_versification)
        try:
            got = client.fetch(row.api_bible_id, ref)
        except BudgetExhausted:
            report.stopped_for_budget = True
            log.warning("Stopped: monthly API.Bible budget reached")
            break
        except UnsupportedReference as exc:
            report.skipped_unsupported.append(f"{label}: {exc}")
            continue
        except ApiBibleError as exc:
            report.failed.append(f"{label}: HTTP {exc.status}")
            continue
        if not got.content or not got.copyright:
            report.failed.append(f"{label}: response missing content or copyright")
            continue
        conn.execute(text(UPSERT_SQL), {
            "pid": row.id, "tr": row.tr_code, "label": got.reference_label,
            "content": got.content, "copyright": got.copyright, "fums": got.fums_token,
        })
        report.fetched += 1
    return report


def main() -> None:
    from app.core.database import engine

    logging.basicConfig(level=logging.INFO)
    with engine.begin() as conn:
        report = refresh(conn, ApiBibleClient(conn))
    log.info("purged=%s fetched=%s unsupported=%s failed=%s budget_stop=%s",
             report.purged, report.fetched, len(report.skipped_unsupported),
             len(report.failed), report.stopped_for_budget)
    for line in report.skipped_unsupported + report.failed:
        log.info("  %s", line)


if __name__ == "__main__":
    main()
