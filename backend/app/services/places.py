"""Places for the then-and-now map (wireframe 4).

A place has an ancient and a modern name, how sure scholars are of its location, and optionally
candidate sites when the location is disputed. Scripture references come from place_passages and
are labeled from the book name, like every other passage on the site.
"""

from dataclasses import dataclass, field
from uuid import UUID

from sqlalchemy import Connection, text

from app.services.scripture import format_reference, ref_from_row


class PlaceNotFound(Exception):
    pass


@dataclass
class PlaceSummary:
    slug: str
    name: str  # common English name, e.g. "Capernaum"
    ancient_name: str
    modern_name: str | None
    place_type: str
    latitude: float | None
    longitude: float | None
    location_confidence: str
    featured_order: int | None
    candidate_count: int
    data_source: str  # 'curated' or 'openbible'


@dataclass
class Candidate:
    label: str
    latitude: float
    longitude: float
    confidence: str
    note: str | None


@dataclass
class PlacePassage:
    id: UUID
    reference: str  # "Luke 24:13–35"


@dataclass
class PlaceEvent:
    slug: str
    title: str


@dataclass
class PlaceDetail(PlaceSummary):
    notes: str | None = None
    notes_status: str = "draft"
    wikidata_id: str | None = None
    source_url: str | None = None  # OpenBible.info page for imported places
    candidates: list[Candidate] = field(default_factory=list)
    passages: list[PlacePassage] = field(default_factory=list)
    events: list[PlaceEvent] = field(default_factory=list)


SUMMARY_SQL = """
SELECT p.*, (SELECT count(*) FROM place_candidates c WHERE c.place_id = p.id) AS candidate_count
FROM places p
"""


def _summary(r) -> PlaceSummary:
    return PlaceSummary(r.slug, r.name, r.ancient_name, r.modern_name, r.place_type, r.latitude, r.longitude,
                        r.location_confidence, r.featured_order, r.candidate_count, r.data_source)


def list_places(conn: Connection, featured_only: bool = False) -> list[PlaceSummary]:
    where = "WHERE p.featured_order IS NOT NULL" if featured_only else ""
    rows = conn.execute(text(f"{SUMMARY_SQL} {where} ORDER BY p.featured_order NULLS LAST, p.name")).all()
    return [_summary(r) for r in rows]


def get_place(conn: Connection, slug: str) -> PlaceDetail:
    r = conn.execute(text(f"{SUMMARY_SQL} WHERE p.slug = :slug"), {"slug": slug}).first()
    if r is None:
        raise PlaceNotFound(slug)
    s = _summary(r)
    detail = PlaceDetail(**s.__dict__, notes=r.notes, notes_status=r.notes_status, wikidata_id=r.wikidata_id,
                         source_url=r.source_url)

    detail.candidates = [
        Candidate(c.label, c.latitude, c.longitude, c.confidence, c.note)
        for c in conn.execute(
            text("SELECT * FROM place_candidates WHERE place_id = :id ORDER BY sort_order, label"), {"id": r.id}
        )
    ]

    passages = conn.execute(text("""
        SELECT sp.*, cb.name AS book_name
        FROM place_passages pp
        JOIN scripture_passages sp ON sp.id = pp.passage_id
        JOIN canon_books cb ON cb.code = sp.book_code
        WHERE pp.place_id = :id
        ORDER BY pp.sort_order, cb.sort_order, sp.chapter_start, sp.verse_start
    """), {"id": r.id}).all()
    detail.passages = [PlacePassage(p.id, format_reference(p.book_name, ref_from_row(p))) for p in passages]

    # Only published events are linked from the public map.
    detail.events = [
        PlaceEvent(e.slug, e.title)
        for e in conn.execute(text("""
            SELECT e.slug, e.title FROM event_places ep JOIN events e ON e.id = ep.event_id
            WHERE ep.place_id = :id AND e.status = 'published'
            ORDER BY e.earliest_year NULLS LAST, e.title
        """), {"id": r.id})
    ]
    return detail
