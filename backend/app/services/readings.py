"""Daily Mass readings: fetched once per date by a job, served from the database.

Only references, section names, the day's title, and a link to the source are
stored. The reading text itself is the copyrighted US lectionary, so the app
links to it instead of copying it.
"""

import json
from dataclasses import dataclass
from datetime import date, datetime
from typing import Protocol

from sqlalchemy import Connection, text


@dataclass
class ReadingRef:
    section: str  # "First Reading", "Responsorial Psalm", "Gospel", ...
    reference: str  # "Numbers 24:2-7, 15-17a"


@dataclass
class DayReadings:
    reading_date: date
    mass_type: str
    title: str
    source_url: str
    readings: list[ReadingRef]
    provider: str
    fetched_at: datetime | None = None


class ReadingsProvider(Protocol):
    name: str

    def fetch(self, day: date) -> DayReadings | None: ...

    def source_url(self, day: date) -> str: ...


class UsccbProvider:
    """Uses the catholic-mass-readings package, which reads bible.usccb.org.

    It is an unofficial scraper: call it at most once per date (the job does),
    and keep the source link visible in the app.
    """

    name = "usccb"

    def source_url(self, day: date) -> str:
        from catholic_mass_readings import models
        return models.MassType.DEFAULT.to_url(day)

    def fetch(self, day: date) -> DayReadings | None:
        import asyncio

        from catholic_mass_readings import USCCB

        async def _get():
            async with USCCB() as usccb:
                return await usccb.get_mass_from_date(day)

        mass = asyncio.run(_get())
        if mass is None:
            return None
        refs: list[ReadingRef] = []
        for section in mass.sections:
            label = getattr(section, "display_header", None) or section.header
            for reading in section.readings:
                refs.append(ReadingRef(section=label, reference=reading.header))  # reference only, no text
        mass_type = mass.type_.name.lower() if hasattr(mass.type_, "name") else (mass.type_ or "default")
        return DayReadings(day, mass_type or "default", mass.title, mass.url, refs, self.name)


def save(conn: Connection, day: DayReadings) -> None:
    conn.execute(
        text("""INSERT INTO daily_readings (reading_date, mass_type, title, source_url, readings, provider)
                VALUES (:d, :t, :title, :url, CAST(:readings AS jsonb), :provider)
                ON CONFLICT (reading_date, mass_type) DO NOTHING"""),
        {"d": day.reading_date, "t": day.mass_type, "title": day.title, "url": day.source_url,
         "readings": json.dumps([r.__dict__ for r in day.readings]), "provider": day.provider},
    )


def dates_missing(conn: Connection, days: list[date]) -> list[date]:
    have = {r[0] for r in conn.execute(
        text("SELECT DISTINCT reading_date FROM daily_readings WHERE reading_date = ANY(:days)"),
        {"days": days},
    )}
    return [d for d in days if d not in have]


def get_for_date(conn: Connection, day: date) -> list[DayReadings]:
    rows = conn.execute(
        text("""SELECT * FROM daily_readings WHERE reading_date = :d
                ORDER BY (mass_type = 'default') DESC, mass_type"""),
        {"d": day},
    ).all()
    return [
        DayReadings(r.reading_date, r.mass_type, r.title, r.source_url,
                    [ReadingRef(**x) for x in r.readings], r.provider, r.fetched_at)
        for r in rows
    ]
