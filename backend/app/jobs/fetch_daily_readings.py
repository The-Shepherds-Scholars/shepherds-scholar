"""Fetch daily Mass readings once per date. Run once a day (early morning).

    python -m app.jobs.fetch_daily_readings

Fetches today plus readings_days_ahead days, skipping dates already stored,
so a normal run makes one call (the newest day) and a missed run catches up.
Past days are only filled in when asked, after an outage:

    python -m app.jobs.fetch_daily_readings --from 2026-11-23

A day is saved only if it has a Gospel. Every Mass has one, so a day without it means the
source page wasn't read properly. Saving it would lock in the gap, because stored dates are
never fetched again. If any day fails, the job exits with an error so the Actions run shows
red instead of quietly succeeding.
"""

import sys

import logging
from dataclasses import dataclass, field
from datetime import date, timedelta

from sqlalchemy import Connection

from app.core.config import get_settings
from app.services import readings

log = logging.getLogger(__name__)


@dataclass
class ReadingsReport:
    fetched: list[date] = field(default_factory=list)
    empty: list[date] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)


def run(conn: Connection, provider: readings.ReadingsProvider, today: date | None = None,
        start: date | None = None) -> ReadingsReport:
    """Fetches from `start` (default: today) through today + readings_days_ahead."""
    today = today or date.today()
    first = min(start or today, today)
    last = today + timedelta(days=get_settings().readings_days_ahead)
    days = [first + timedelta(days=i) for i in range((last - first).days + 1)]
    report = ReadingsReport()
    for day in readings.dates_missing(conn, days):
        try:
            result = provider.fetch(day)
        except Exception as exc:  # a provider outage must not stop the other days
            report.failed.append(f"{day}: {exc}")
            continue
        if result is None:
            report.empty.append(day)
            continue
        if not any("gospel" in r.section.lower() for r in result.readings):
            found = ", ".join(r.section for r in result.readings) or "nothing"
            report.failed.append(f"{day}: incomplete page, found {found} but no Gospel")
            continue
        readings.save(conn, result)
        report.fetched.append(day)
    return report


def main() -> None:
    import argparse

    from app.core.database import engine

    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--from", dest="start", type=date.fromisoformat, metavar="YYYY-MM-DD",
                        help="also fill in missing days from this date, to catch up after an outage")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)
    with engine.begin() as conn:
        report = run(conn, readings.UsccbProvider(), start=args.start)
    log.info("fetched=%s empty=%s failed=%s", report.fetched, report.empty, report.failed)
    if report.failed:
        # Days that worked are already saved; fail the run so the problem is visible on GitHub.
        for f in report.failed:
            print(f"::error::Readings not saved for {f}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
