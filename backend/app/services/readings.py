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

        async def _get():
            async with _usccb_class()() as usccb:
                return await usccb.get_mass_from_date(day)

        return self.to_day(day, asyncio.run(_get()))

    def to_day(self, day: date, mass) -> DayReadings | None:
        """Turns the package's Mass into references only (no reading text)."""
        if mass is None:
            return None
        refs: list[ReadingRef] = []
        for section in mass.sections:
            label = getattr(section, "display_header", None) or section.header
            for reading in section.readings:
                refs.append(ReadingRef(section=label, reference=reading.header))  # reference only, no text
        mass_type = mass.type_.name.lower() if hasattr(mass.type_, "name") else (mass.type_ or "default")
        return DayReadings(day, mass_type or "default", mass.title, mass.url, refs, self.name)


def _usccb_class():
    """The package's USCCB client, with the section finder updated for USCCB's November 2026 pages.

    The package (0.8.1, the newest) expects one block per reading, each with its own name,
    reference, and text. Since about November 23, 2026, USCCB puts every reading in one block:
    a run of <header class="content-header"> elements (h3.name and p.address), each followed by
    the reading's paragraphs. The package then read only the first reading and failed on its
    text. This app stores references only, so for the new layout it reads each header's name and
    reference links and skips the text. Pages in the old layout still go through the package.
    Labels and book names still come from the package, so stored rows look the same as before.
    """
    from catholic_mass_readings import USCCB, models

    class ReferencesOnly(USCCB):
        def _get_sections(self, soup):
            headers = soup.find_all("header", class_="content-header")
            if not headers:
                return super()._get_sections(soup)
            sections: list = []
            for h in headers:
                name, address = h.find(class_="name"), h.find(class_="address")
                if not name or not address:
                    continue
                verses = self._get_verses(address)
                if not verses:
                    continue
                header = name.get_text(strip=True)
                type_ = models.SectionType.from_header(header)
                section = models.Section(type_, header, [models.Reading(verses, "")])
                if sections and type_.is_alternative:  # "Or" readings join the one before
                    sections[-1] = sections[-1].add_alternative(section.readings)
                    continue
                sections.append(section)
            return sections

    return ReferencesOnly


def parse_usccb_page(html: str, day: date, url: str) -> DayReadings | None:
    """Parses a saved USCCB readings page without going online. Used by tests."""
    from bs4 import BeautifulSoup
    from catholic_mass_readings import models

    soup = BeautifulSoup(html, "html5lib")
    sections = _usccb_class()()._get_sections(soup)
    title = soup.find("title").get_text(strip=True).split("|")[0].strip()
    return UsccbProvider().to_day(day, models.Mass(day, models.MassType.DEFAULT, url, title, sections))


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
