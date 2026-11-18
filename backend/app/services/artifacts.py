"""Artifacts for the map's artifacts layer: where each find was made, its date, its photo, how sure
scholars are that it is genuine, and which claims it bears on.

The list is small (hand-picked finds plus the Wikidata import), so one query returns everything the
map needs and the static export writes it to a single file.
"""

from dataclasses import dataclass, field

from sqlalchemy import Connection, text


@dataclass
class ArtifactClaim:
    statement: str
    claim_type: str
    evidence_role: str
    annotation: str | None
    event_slug: str
    event_title: str


@dataclass
class Artifact:
    slug: str
    name: str
    artifact_type: str
    description: str | None
    significance: str | None
    notes_status: str
    authenticity: str
    authenticity_note: str | None
    year_discovered: int | None
    place_slug: str | None
    place_name: str | None
    latitude: float | None  # find spot, else the place's location
    longitude: float | None
    earliest_year: int | None
    latest_year: int | None
    date_label: str | None
    museum: str | None
    museum_url: str | None
    image_url: str | None
    image_license: str | None
    image_credit: str | None
    image_source_url: str | None
    data_source: str
    source_url: str | None
    wikidata_id: str | None
    claims: list[ArtifactClaim] = field(default_factory=list)


LIST_SQL = """
SELECT a.*, p.slug AS place_slug, p.name AS place_name,
       coalesce(a.find_latitude, p.latitude) AS lat, coalesce(a.find_longitude, p.longitude) AS lon,
       coalesce(a.date_label, format_year_range(a.earliest_year, a.latest_year)) AS label
FROM artifacts a
LEFT JOIN places p ON p.id = a.found_at_place_id
ORDER BY (a.data_source = 'curated') DESC, a.earliest_year NULLS LAST, a.name
"""

# Only claims on published events reach the public site.
CLAIMS_SQL = """
SELECT ca.artifact_id, ca.evidence_role, ca.annotation, c.statement, c.claim_type, e.slug, e.title
FROM claim_artifacts ca
JOIN claims c ON c.id = ca.claim_id
JOIN events e ON e.id = c.event_id
WHERE e.status = 'published'
ORDER BY e.earliest_year NULLS LAST, e.title, c.sort_order
"""


def list_artifacts(conn: Connection) -> list[Artifact]:
    claims: dict = {}
    for r in conn.execute(text(CLAIMS_SQL)):
        claims.setdefault(r.artifact_id, []).append(
            ArtifactClaim(r.statement, r.claim_type, r.evidence_role, r.annotation, r.slug, r.title))
    return [
        Artifact(
            slug=r.slug, name=r.name, artifact_type=r.artifact_type, description=r.description,
            significance=r.significance, notes_status=r.notes_status, authenticity=r.authenticity,
            authenticity_note=r.authenticity_note, year_discovered=r.year_discovered,
            place_slug=r.place_slug, place_name=r.place_name, latitude=r.lat, longitude=r.lon,
            earliest_year=r.earliest_year, latest_year=r.latest_year, date_label=r.label,
            museum=r.museum, museum_url=r.museum_url, image_url=r.image_url, image_license=r.image_license,
            image_credit=r.image_credit, image_source_url=r.image_source_url, data_source=r.data_source,
            source_url=r.source_url, wikidata_id=r.wikidata_id, claims=claims.get(r.id, []),
        )
        for r in conn.execute(text(LIST_SQL))
    ]
