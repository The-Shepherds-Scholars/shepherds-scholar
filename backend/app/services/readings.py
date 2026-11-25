"""Daily Mass readings: fetched once per date by a job, served from the database.

Only references, section names, the day's title, and a link to the source are
stored. The reading text itself is the copyrighted US lectionary, so the app
links to it instead of copying it.
"""

import json
import re
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

    def fetch(self, day: date) -> DayReadings | list[DayReadings] | None: ...

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

    def fetch(self, day: date) -> list[DayReadings]:
        """Every set of readings for the day: usually one, more on days like Thanksgiving."""
        import asyncio

        async def _get():
            async with _usccb_class()() as usccb:
                mass = await usccb.get_mass_from_date(day)
                if mass is None:
                    return []
                if mass.sections or not usccb.menu_links:
                    return [(mass, None)]
                # A menu page: follow each link to its own set of readings.
                found = []
                for url in usccb.menu_links:
                    usccb.menu_links = []
                    linked = await usccb.get_mass_from_url(url)
                    if linked is not None:
                        found.append((linked, mass_type_from_url(url)))
                return found

        return [self.to_day(day, mass, mass_type) for mass, mass_type in asyncio.run(_get())]

    def to_day(self, day: date, mass, mass_type: str | None = None) -> DayReadings | None:
        """Turns the package's Mass into references only (no reading text)."""
        if mass is None:
            return None
        refs: list[ReadingRef] = []
        for section in mass.sections:
            label = getattr(section, "display_header", None) or section.header
            for reading in section.readings:
                refs.append(ReadingRef(section=label, reference=reading.header))  # reference only, no text
        if mass_type is None:
            mass_type = mass.type_.name.lower() if hasattr(mass.type_, "name") else (mass.type_ or "default")
        return DayReadings(day, mass_type or "default", mass.title, mass.url, refs, self.name)


_MENU_LINK = re.compile(r"/bible/readings/(\d{6})-([A-Za-z][A-Za-z-]*)(?:\.cfm)?$")


def menu_links(soup) -> list[str]:
    """Links from a USCCB menu page to each set of the day's readings.

    On days with more than one set (Thanksgiving, Christmas, Easter), the day's main page has no
    readings of its own. Its lectionary block instead links to pages like 112626-Ordinary and
    112626-Thanksgiving, each a normal readings page.
    """
    links: list[str] = []
    for block in soup.find_all(class_="b-lectionary"):
        for a in block.find_all("a", href=True):
            href = a["href"].strip()
            if _MENU_LINK.search(href) and href not in links:
                links.append(href)
    return links


def mass_type_from_url(url: str) -> str:
    """112626-Thanksgiving -> "thanksgiving"; stored as daily_readings.mass_type (20 characters)."""
    m = _MENU_LINK.search(url)
    return (m.group(2).lower() if m else "other")[:20]


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
        menu_links: list[str] = []  # set when the last page read was a menu (see menu_links())

        def _get_sections(self, soup):
            self.menu_links = menu_links(soup)
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
    client = _usccb_class()()
    sections = client._get_sections(soup)
    if not sections and client.menu_links:
        return None
    title = soup.find("title").get_text(strip=True).split("|")[0].strip()
    return UsccbProvider().to_day(day, models.Mass(day, models.MassType.DEFAULT, url, title, sections))


def replace_day(conn: Connection, day: date, masses: list[DayReadings]) -> None:
    """Stores the day's readings, removing any rows for that date first.

    A day re-fetched after a bad save (like Thanksgiving 2026, first stored empty as "default")
    then ends up with exactly the sets the source lists now.
    """
    conn.execute(text("DELETE FROM daily_readings WHERE reading_date = :d"), {"d": day})
    for m in masses:
        save(conn, m)


def save(conn: Connection, day: DayReadings) -> None:
    conn.execute(
        text("""INSERT INTO daily_readings (reading_date, mass_type, title, source_url, readings, provider)
                VALUES (:d, :t, :title, :url, CAST(:readings AS jsonb), :provider)
                ON CONFLICT (reading_date, mass_type) DO UPDATE SET
                    title = EXCLUDED.title, source_url = EXCLUDED.source_url, readings = EXCLUDED.readings,
                    provider = EXCLUDED.provider, fetched_at = now()"""),
        {"d": day.reading_date, "t": day.mass_type, "title": day.title, "url": day.source_url,
         "readings": json.dumps([r.__dict__ for r in day.readings]), "provider": day.provider},
    )


def dates_missing(conn: Connection, days: list[date]) -> list[date]:
    """Dates with no stored readings, or stored without a Gospel (a page that wasn't read fully).

    Treating a Gospel-less day as missing lets the next run replace it. Before November 24, 2026
    such days could be saved, like Thanksgiving 2026, stored with no readings at all.
    """
    have = {r[0] for r in conn.execute(
        text("""SELECT DISTINCT reading_date FROM daily_readings
                WHERE reading_date = ANY(:days)
                  AND EXISTS (SELECT 1 FROM jsonb_array_elements(readings) r
                              WHERE r->>'section' ILIKE '%gospel%')"""),
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
