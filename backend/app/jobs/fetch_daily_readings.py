"""Fetch daily Mass readings once per date. Run once a day (early morning).

    python -m app.jobs.fetch_daily_readings

Fetches today plus readings_days_ahead days, skipping dates already stored,
so a normal run makes one call (the newest day) and a missed run catches up.
"""

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


def run(conn: Connection, provider: readings.ReadingsProvider, today: date | None = None) -> ReadingsReport:
    today = today or date.today()
    days = [today + timedelta(days=i) for i in range(get_settings().readings_days_ahead + 1)]
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
        readings.save(conn, result)
        report.fetched.append(day)
    return report


def main() -> None:
    from app.core.database import engine

    logging.basicConfig(level=logging.INFO)
    with engine.begin() as conn:
        report = run(conn, readings.UsccbProvider())
    log.info("fetched=%s empty=%s failed=%s", report.fetched, report.empty, report.failed)


if __name__ == "__main__":
    main()
