"""Import every biblical place from OpenBible.info's Bible Geocoding Data into the places tables.

Source: https://github.com/openbibleinfo/Bible-Geocoding-Data (CC BY 4.0, credit OpenBible.info).
Download once (about 11 MB and 3 MB) into backend/data/openbible/:

    curl -o data/openbible/ancient.jsonl https://raw.githubusercontent.com/openbibleinfo/Bible-Geocoding-Data/main/data/ancient.jsonl
    curl -o data/openbible/modern.jsonl  https://raw.githubusercontent.com/openbibleinfo/Bible-Geocoding-Data/main/data/modern.jsonl

Then, from backend/:

    python -m scripts.import_openbible_places data/openbible/ancient.jsonl data/openbible/modern.jsonl

Safe to re-run. Places are matched by OpenBible's id; their candidates and verses are replaced.
Curated places (the map's hand-written featured places) are never touched. An OpenBible place is
skipped when a curated place has its id (source_ref) or its slug.

How OpenBible's data maps onto ours:
  * The best-scoring identification with coordinates gives the place's latitude/longitude and
    modern name. OpenBible scores identifications from below 0 up to about 1000.
  * location_confidence comes from that score: 950+ certain, 600+ probable, 200+ possible, else
    unknown. This is our simplification of OpenBible's scores, not their wording.
  * When the best score is below 600 and other identifications have coordinates, up to four are
    stored as candidates, so the map can show the competing sites.
  * Verse references use Protestant (Hebrew-style) numbering, stored with versification='hebrew',
    so Psalms convert correctly for the Douay-Rheims.
"""

import json
import re
import sys
from dataclasses import dataclass, field

from sqlalchemy import Connection, text

TAG = re.compile(r"<[^>]+>")
WIKIDATA_SOURCE = "s7cc8b2"  # OpenBible's source id for Wikidata in linked_data
PLACE_TYPE = {
    "settlement": "city", "settlement and spring": "city", "district in settlement": "city",
    "region": "region", "people group": "region", "natural area": "region",
    "mountain": "mountain", "hill": "mountain", "mountain range": "mountain", "mountain ridge": "mountain",
    "mountain pass": "mountain", "promontory": "mountain", "cliff": "mountain",
    "river": "body_of_water", "body of water": "body_of_water", "wadi": "body_of_water", "spring": "body_of_water",
    "pool": "body_of_water", "well": "body_of_water", "canal": "body_of_water", "ford": "body_of_water",
    "campsite": "route_point", "road": "route_point",
}


def confidence(score: float | None) -> str:
    if score is None:
        return "unknown"
    if score >= 950:
        return "certain"
    if score >= 600:
        return "probable"
    if score >= 200:
        return "possible"
    return "unknown"


@dataclass
class Identification:
    label: str
    lat: float
    lon: float
    score: float


@dataclass
class ImportedPlace:
    ref: str
    slug: str
    name: str
    place_type: str
    modern_name: str | None
    lat: float | None
    lon: float | None
    confidence: str
    wikidata_id: str | None
    source_url: str
    candidates: list[Identification] = field(default_factory=list)
    verses: list[tuple[str, int, int]] = field(default_factory=list)  # (book, chapter, verse)


def _identifications(record: dict, modern: dict[str, dict]) -> list[Identification]:
    out = []
    for ident in record.get("identifications") or []:
        score = (ident.get("score") or {}).get("time_total")
        lonlat = next((r["lonlat"] for r in ident.get("resolutions") or [] if r.get("lonlat")), None)
        if score is None or not lonlat:
            continue
        lon, lat = (float(x) for x in lonlat.split(","))
        label = TAG.sub("", ident.get("description") or "").strip()
        if ident.get("id_source") == "modern" and ident.get("id") in modern:
            label = modern[ident["id"]].get("friendly_id") or label
        out.append(Identification(label[:200] or "Unnamed site", lat, lon, float(score)))
    return sorted(out, key=lambda i: i.score, reverse=True)


def parse(record: dict, modern: dict[str, dict]) -> ImportedPlace:
    ids = _identifications(record, modern)
    best = ids[0] if ids else None
    wikidata = (record.get("linked_data") or {}).get(WIKIDATA_SOURCE, {}).get("id")
    types = record.get("types") or []
    place = ImportedPlace(
        ref=record["id"],
        slug=record["url_slug"],
        # OpenBible numbers places that share a name ("Bethlehem 1", "Bethlehem 2"); the slug keeps the
        # number, and the modern name tells them apart on screen.
        name=re.sub(r" \d+$", "", record["friendly_id"])[:200],
        place_type=PLACE_TYPE.get(types[0] if types else "", "site"),
        modern_name=best.label if best else None,
        lat=best.lat if best else None,
        lon=best.lon if best else None,
        confidence=confidence(best.score if best else None),
        wikidata_id=wikidata if isinstance(wikidata, str) and re.fullmatch(r"Q[0-9]+", wikidata) else None,
        source_url=f"https://www.openbible.info/geo/ancient/{record['id']}/{record['url_slug']}",
    )
    if best and best.score < 600:
        place.candidates = [i for i in ids if i.score > 0][:4] if len(ids) > 1 else []
    for v in sorted(record.get("verses") or [], key=lambda v: v.get("sort", "")):
        m = re.fullmatch(r"([0-9A-Z]{3}) (\d+):(\d+)", v.get("usx", ""))
        if m:
            place.verses.append((m.group(1), int(m.group(2)), int(m.group(3))))
    return place


def load_files(ancient_path: str, modern_path: str) -> list[ImportedPlace]:
    with open(modern_path, encoding="utf-8") as f:
        modern = {r["id"]: r for r in (json.loads(line) for line in f if line.strip())}
    with open(ancient_path, encoding="utf-8") as f:
        return [parse(json.loads(line), modern) for line in f if line.strip()]


def save(conn: Connection, places: list[ImportedPlace]) -> dict[str, int]:
    books = dict(conn.execute(text("SELECT code, name FROM canon_books")).all())
    curated = conn.execute(text("SELECT slug, source_ref FROM places WHERE data_source = 'curated'")).all()
    curated_slugs = {r.slug for r in curated}
    curated_refs = {r.source_ref for r in curated if r.source_ref}
    total = len(places)
    places = [p for p in places if p.slug not in curated_slugs and p.ref not in curated_refs]
    # Remove earlier imports of places that are now curated.
    if curated_refs:
        conn.execute(text("DELETE FROM places WHERE data_source = 'openbible' AND source_ref = ANY(:refs)"),
                     {"refs": list(curated_refs)})

    if not places:
        return {"places": 0, "candidates": 0, "verse_links": 0, "skipped_curated": total}
    conn.execute(text("""
        INSERT INTO places (slug, name, ancient_name, modern_name, place_type, latitude, longitude,
                            location_confidence, wikidata_id, notes, notes_status, featured_order,
                            data_source, source_ref, source_url)
        VALUES (:slug, :name, :name, :modern_name, :place_type, :lat, :lon,
                :confidence, :wikidata_id, NULL, 'draft', NULL, 'openbible', :ref, :source_url)
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name, ancient_name = EXCLUDED.ancient_name, modern_name = EXCLUDED.modern_name,
            place_type = EXCLUDED.place_type, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
            location_confidence = EXCLUDED.location_confidence, wikidata_id = EXCLUDED.wikidata_id,
            source_ref = EXCLUDED.source_ref, source_url = EXCLUDED.source_url
        WHERE places.data_source = 'openbible'
    """), [p.__dict__ for p in places])
    ids = dict(conn.execute(text("SELECT source_ref, id FROM places WHERE data_source = 'openbible'")).all())

    # Replace candidates and verse links for imported places only.
    conn.execute(text("""DELETE FROM place_candidates WHERE place_id IN
                         (SELECT id FROM places WHERE data_source = 'openbible')"""))
    conn.execute(text("""DELETE FROM place_passages WHERE place_id IN
                         (SELECT id FROM places WHERE data_source = 'openbible')"""))
    candidate_rows = [
        {"place_id": ids[p.ref], "label": c.label, "lat": c.lat, "lon": c.lon, "confidence": confidence(c.score),
         "note": f"OpenBible.info score {round(c.score)} of 1000", "sort_order": i}
        for p in places for i, c in enumerate(p.candidates)
    ]
    if candidate_rows:
        conn.execute(text("""
            INSERT INTO place_candidates (place_id, label, latitude, longitude, confidence, note, sort_order)
            VALUES (:place_id, :label, :lat, :lon, :confidence, :note, :sort_order)
        """), candidate_rows)

    # One single-verse passage per (book, chapter, verse), shared across places.
    verses = {v for p in places for v in p.verses if v[0] in books}
    if verses:
        conn.execute(text("""
            INSERT INTO scripture_passages (book_code, chapter_start, verse_start, versification, canonical_reference)
            VALUES (:b, :c, :v, 'hebrew', :label)
            ON CONFLICT DO NOTHING
        """), [{"b": b, "c": c, "v": v, "label": f"{books[b]} {c}:{v}"} for b, c, v in sorted(verses)])
    passage_ids = {
        (r.book_code, r.chapter_start, r.verse_start): r.id
        for r in conn.execute(text("""
            SELECT id, book_code, chapter_start, verse_start FROM scripture_passages
            WHERE versification = 'hebrew' AND chapter_end IS NULL AND verse_end IS NULL AND verse_start IS NOT NULL
        """))
    }
    link_rows, seen = [], set()
    for p in places:
        for i, v in enumerate(p.verses):
            pid = passage_ids.get(v)
            if pid and (p.ref, pid) not in seen:
                seen.add((p.ref, pid))
                link_rows.append({"place_id": ids[p.ref], "passage_id": pid, "sort_order": min(i, 32000)})
    if link_rows:
        conn.execute(text("""
            INSERT INTO place_passages (place_id, passage_id, sort_order) VALUES (:place_id, :passage_id, :sort_order)
        """), link_rows)
    return {"places": len(places), "candidates": len(candidate_rows), "verse_links": len(link_rows),
            "skipped_curated": total - len(places)}


def main() -> None:
    from app.core.database import engine

    if len(sys.argv) != 3:
        sys.exit("usage: python -m scripts.import_openbible_places ANCIENT.jsonl MODERN.jsonl")
    places = load_files(sys.argv[1], sys.argv[2])
    with engine.begin() as conn:
        print(save(conn, places))


if __name__ == "__main__":
    main()
