import json

from sqlalchemy import text

from app.jobs import refresh_passage_cache
from app.services import places
from scripts.import_openbible_places import load_files, save
from scripts.seed_places import seed


def _ident(desc, modern_id, lonlat, score):
    return {"description": desc, "id": modern_id, "id_source": "modern", "score": {"time_total": score},
            "resolutions": [{"lonlat": lonlat}]}


ANCIENT = [
    {   # Same slug as a curated place: must be skipped.
        "id": "a15257a", "url_slug": "jerusalem", "friendly_id": "Jerusalem", "types": ["settlement"],
        "identifications": [_ident('<modern id="m1">Jerusalem</modern>', "m1", "35.23,31.77", 1000)],
        "verses": [{"usx": "JOS 10:1", "sort": "06010001"}],
    },
    {   # Disputed place: two sites with coordinates and a low best score.
        "id": "a000001", "url_slug": "zoar-1", "friendly_id": "Zoar 1", "types": ["settlement"],
        "linked_data": {"s7cc8b2": {"id": "Q123"}},
        "identifications": [
            _ident('<modern id="m2">Ghor es-Safi</modern>', "m2", "35.47,31.03", 410),
            _ident('near <modern id="m3">Bab edh-Dhra</modern>', "m3", "35.53,31.25", 150),
        ],
        "verses": [{"usx": "GEN 13:10", "sort": "01013010"}, {"usx": "PSA 23:1", "sort": "19023001"}],
    },
]
MODERN = [{"id": "m1", "friendly_id": "Jerusalem"}, {"id": "m2", "friendly_id": "Ghor es-Safi"},
          {"id": "m3", "friendly_id": "Bab edh-Dhra"}]


def _files(tmp_path):
    a, m = tmp_path / "ancient.jsonl", tmp_path / "modern.jsonl"
    a.write_text("\n".join(json.dumps(r) for r in ANCIENT))
    m.write_text("\n".join(json.dumps(r) for r in MODERN))
    return str(a), str(m)


def test_import_keeps_curated_places_and_loads_the_rest(conn, tmp_path):
    seed(conn)
    report = save(conn, load_files(*_files(tmp_path)))
    report = save(conn, load_files(*_files(tmp_path)))  # repeatable
    assert report["places"] == 1 and report["verse_links"] == 2 and report["skipped_curated"] == 1

    jerusalem = places.get_place(conn, "jerusalem")
    assert jerusalem.data_source == "curated" and jerusalem.ancient_name == "Hierosolyma"

    zoar = places.get_place(conn, "zoar-1")
    assert zoar.data_source == "openbible" and zoar.location_confidence == "possible" and zoar.name == "Zoar"
    assert zoar.modern_name == "Ghor es-Safi" and (zoar.latitude, zoar.longitude) == (31.03, 35.47)
    assert [c.label for c in zoar.candidates] == ["Ghor es-Safi", "Bab edh-Dhra"]
    assert zoar.source_url.startswith("https://www.openbible.info/geo/ancient/a000001/")
    assert [p.reference for p in zoar.passages] == ["Genesis 13:10", "Psalm 23:1"]
    # Psalms are stored in Hebrew numbering, so the Douay-Rheims lookup converts them.
    assert conn.execute(text("""SELECT versification FROM scripture_passages
                                WHERE book_code = 'PSA' AND chapter_start = 23""")).scalar_one() == "hebrew"


def test_place_matched_by_openbible_id_is_not_duplicated(conn, tmp_path):
    seed(conn)  # curated Bethlehem carries OpenBible's id a112427
    record = {"id": "a112427", "url_slug": "bethlehem-1", "friendly_id": "Bethlehem 1", "types": ["settlement"],
              "identifications": [_ident('<modern id="m1">Bethlehem</modern>', "m1", "35.20,31.70", 1000)]}
    a, m = tmp_path / "a.jsonl", tmp_path / "m.jsonl"
    a.write_text(json.dumps(record))
    m.write_text(json.dumps({"id": "m1", "friendly_id": "Bethlehem"}))
    save(conn, load_files(str(a), str(m)))
    assert conn.execute(text("SELECT count(*) FROM places WHERE name = 'Bethlehem'")).scalar_one() == 1


def test_cache_job_ignores_imported_place_verses(conn, tmp_path):
    save(conn, load_files(*_files(tmp_path)))
    conn.execute(text("""INSERT INTO bible_translations (code, name, source, api_bible_id, versification, license,
                                                         citation, citation_short)
                         VALUES ('RSVCE', 'Test', 'api_bible', 'abc-01', 'hebrew', 'Licensed', 'c', 'c')"""))
    due = conn.execute(text(refresh_passage_cache.DUE_SQL), {"refresh_days": 25}).all()
    assert due == []
