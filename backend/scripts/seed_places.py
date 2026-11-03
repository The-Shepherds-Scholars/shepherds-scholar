"""Load the featured places for the then-and-now map. Safe to re-run: places are updated by slug,
and each place's candidates and passages are replaced.

    python -m scripts.seed_places

Notes and candidate descriptions are DRAFTS, written with AI help. They are stored with
notes_status='draft' and the map labels them as drafts until someone checks each one against
sources and sets notes_status='checked'. Coordinates are approximate (to roughly 100 m) and should be
checked against OpenBible.info's geocoding data or Pleiades before launch.
"""

from sqlalchemy import Connection, text

# source_ref is the place's OpenBible.info id, so the OpenBible import never adds a second copy of it.
# (book, chapter_start, verse_start, chapter_end, verse_end). verse_end None = single verse.
PLACES = [
    {
        "slug": "jerusalem", "source_ref": "a15257a", "name": "Jerusalem", "featured_order": 1, "place_type": "city",
        "ancient_name": "Hierosolyma", "modern_name": "Jerusalem",
        "latitude": 31.7781, "longitude": 35.2354, "location_confidence": "certain", "wikidata_id": "Q1218",
        "notes": "Continuously inhabited since long before Jesus, so its identification is secure.",
        "passages": [("LUK", 19, 41, 19, 44), ("MRK", 11, 1, 11, 11), ("JHN", 19, 17, 19, 20)],
        "candidates": [],
    },
    {
        "slug": "bethlehem", "source_ref": "a112427", "name": "Bethlehem", "featured_order": 2, "place_type": "city",
        "ancient_name": "Bethleem", "modern_name": "Bethlehem",
        "latitude": 31.7043, "longitude": 35.2077, "location_confidence": "certain", "wikidata_id": None,
        "notes": (
            "The town has been lived in since biblical times, so its location is secure. The cave beneath the "
            "Church of the Nativity is the traditional place of Jesus’s birth, honored at least since the "
            "second century."
        ),
        "passages": [("MAT", 2, 1, 2, 6), ("LUK", 2, 4, 2, 7)],
        "candidates": [],
    },
    {
        "slug": "nazareth", "source_ref": "af5884f", "name": "Nazareth", "featured_order": 3, "place_type": "city",
        "ancient_name": "Nazareth", "modern_name": "Nazareth",
        "latitude": 32.7021, "longitude": 35.2978, "location_confidence": "certain", "wikidata_id": None,
        "notes": (
            "A small village in Jesus’s time on the same hillside as the modern city. Excavations near the "
            "Basilica of the Annunciation have uncovered houses from the first century."
        ),
        "passages": [("LUK", 1, 26, 1, 38), ("MAT", 2, 23, None, None), ("LUK", 4, 16, 4, 30)],
        "candidates": [],
    },
    {
        "slug": "capernaum", "source_ref": "af2161c", "name": "Capernaum", "featured_order": 4, "place_type": "city",
        "ancient_name": "Capharnaum", "modern_name": "Kfar Nahum (Tell Hum)",
        "latitude": 32.8807, "longitude": 35.5750, "location_confidence": "probable", "wikidata_id": None,
        "notes": (
            "Identified with the ruins at Tell Hum on the north shore of the Sea of Galilee, an identification "
            "most scholars accept. A later limestone synagogue stands there over an older one, and a house "
            "beneath an octagonal church is honored as St. Peter’s."
        ),
        "passages": [("MAT", 4, 13, None, None), ("MRK", 1, 21, 1, 28), ("LUK", 7, 1, 7, 10)],
        "candidates": [],
    },
    {
        "slug": "emmaus", "source_ref": "ae7274b", "name": "Emmaus", "featured_order": 5, "place_type": "site",
        "ancient_name": "Emmaus", "modern_name": None,
        "latitude": None, "longitude": None, "location_confidence": "unknown", "wikidata_id": None,
        "notes": (
            "Luke places Emmaus sixty stadia, about 11 km (7 miles), from Jerusalem; some ancient manuscripts "
            "say one hundred sixty. Several sites have been proposed, and none is certain, so each candidate "
            "is shown on the map."
        ),
        "passages": [("LUK", 24, 13, 24, 35)],
        "candidates": [
            {
                "label": "Emmaus Nicopolis (Imwas, near Latrun)", "latitude": 31.8389, "longitude": 34.9895,
                "confidence": "possible",
                "note": "About 30 km from Jerusalem, matching the manuscripts that say 160 stadia. Eusebius and Jerome identified Emmaus here.",
            },
            {
                "label": "El-Qubeibeh", "latitude": 31.8425, "longitude": 35.1314, "confidence": "traditional",
                "note": "About 11 km from Jerusalem, matching 60 stadia. Honored as Emmaus since the Crusader period, with a Franciscan church today.",
            },
            {
                "label": "Abu Ghosh", "latitude": 31.8071, "longitude": 35.1093, "confidence": "traditional",
                "note": "About 13 km from Jerusalem. Crusaders also identified Emmaus here.",
            },
            {
                "label": "Motza (Roman Colonia)", "latitude": 31.7930, "longitude": 35.1580, "confidence": "possible",
                "note": "Close to Jerusalem. Josephus mentions an Emmaus near the city where Vespasian settled veterans, often identified with this site.",
            },
        ],
    },
]

BOOK_NAMES_SQL = "SELECT name FROM canon_books WHERE code = :b"


def _passage_id(conn: Connection, book: str, c1: int, v1: int | None, c2: int | None, v2: int | None) -> str:
    name = conn.execute(text(BOOK_NAMES_SQL), {"b": book}).scalar_one()
    if v2 is None:
        label = f"{name} {c1}:{v1}"
    elif c2 == c1:
        label = f"{name} {c1}:{v1}–{v2}"
    else:
        label = f"{name} {c1}:{v1}–{c2}:{v2}"
    params = {"b": book, "c1": c1, "v1": v1, "c2": c2 if v2 is not None else None, "v2": v2, "label": label}
    conn.execute(text("""
        INSERT INTO scripture_passages (book_code, chapter_start, verse_start, chapter_end, verse_end,
                                        versification, canonical_reference)
        VALUES (:b, :c1, :v1, :c2, :v2, 'hebrew', :label)
        ON CONFLICT DO NOTHING
    """), params)
    return conn.execute(text("""
        SELECT id FROM scripture_passages
        WHERE book_code = :b AND chapter_start = :c1 AND coalesce(verse_start, 0) = coalesce(:v1, 0)
          AND coalesce(chapter_end, 0) = coalesce(:c2, 0) AND coalesce(verse_end, 0) = coalesce(:v2, 0)
          AND versification = 'hebrew'
    """), params).scalar_one()


def seed(conn: Connection) -> int:
    for p in PLACES:
        place_id = conn.execute(text("""
            INSERT INTO places (slug, name, ancient_name, modern_name, place_type, latitude, longitude,
                                location_confidence, wikidata_id, notes, notes_status, featured_order, data_source, source_ref)
            VALUES (:slug, :name, :ancient_name, :modern_name, :place_type, :latitude, :longitude,
                    :location_confidence, :wikidata_id, :notes, 'draft', :featured_order, 'curated', :source_ref)
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name, ancient_name = EXCLUDED.ancient_name, modern_name = EXCLUDED.modern_name,
                place_type = EXCLUDED.place_type, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
                location_confidence = EXCLUDED.location_confidence, wikidata_id = EXCLUDED.wikidata_id,
                notes = EXCLUDED.notes, featured_order = EXCLUDED.featured_order, source_ref = EXCLUDED.source_ref
            RETURNING id
        """), {k: v for k, v in p.items() if k not in ("passages", "candidates")}).scalar_one()

        conn.execute(text("DELETE FROM place_candidates WHERE place_id = :id"), {"id": place_id})
        for i, c in enumerate(p["candidates"]):
            conn.execute(text("""
                INSERT INTO place_candidates (place_id, label, latitude, longitude, confidence, note, sort_order)
                VALUES (:place_id, :label, :latitude, :longitude, :confidence, :note, :sort_order)
            """), {**c, "place_id": place_id, "sort_order": i})

        conn.execute(text("DELETE FROM place_passages WHERE place_id = :id"), {"id": place_id})
        for i, ref in enumerate(p["passages"]):
            conn.execute(text("""
                INSERT INTO place_passages (place_id, passage_id, sort_order) VALUES (:p, :s, :i)
            """), {"p": place_id, "s": _passage_id(conn, *ref), "i": i})
    return len(PLACES)


def main() -> None:
    from app.core.database import engine

    with engine.begin() as conn:
        print(f"Seeded {seed(conn)} places.")


if __name__ == "__main__":
    main()
