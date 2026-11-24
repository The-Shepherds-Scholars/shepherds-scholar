import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from app.core.database import get_conn
from app.main import app
from app.services import artifacts
from scripts import import_wikidata_artifacts as wd
from scripts.export_static_data import export
from scripts.seed_artifacts import seed
from scripts.seed_places import seed as seed_places


def _artifact(conn, slug):
    return next(a for a in artifacts.list_artifacts(conn) if a.slug == slug)


def _claim(conn, status="published"):
    era = conn.execute(text("INSERT INTO eras (slug, name, sort_order) VALUES ('gospels', 'Gospels', 99) RETURNING id")).scalar_one()
    event = conn.execute(text("""INSERT INTO events (era_id, slug, title, summary, earliest_year, status)
                                 VALUES (:e, 'trial-before-pilate', 'Trial before Pilate', 's', 30, :s) RETURNING id"""),
                         {"e": era, "s": status}).scalar_one()
    return conn.execute(text("""INSERT INTO claims (event_id, claim_type, statement)
                                VALUES (:e, 'historical_consensus', 'Pilate governed Judea.') RETURNING id"""),
                        {"e": event}).scalar_one()


def _link(conn, claim_id, slug, role):
    conn.execute(text("""INSERT INTO claim_artifacts (claim_id, artifact_id, evidence_role)
                         SELECT :c, id, :r FROM artifacts WHERE slug = :s"""), {"c": claim_id, "s": slug, "r": role})


# ------------------------------------------------------------------ seed and rules

def test_seed_is_repeatable_and_links_loaded_places(conn):
    seed_places(conn)
    seed(conn)
    seed(conn)  # no duplicates
    found = artifacts.list_artifacts(conn)
    assert len(found) == 7 and all(a.data_source == "curated" and a.notes_status == "draft" for a in found)
    caiaphas = _artifact(conn, "caiaphas-ossuary")
    assert caiaphas.place_slug == "jerusalem" and caiaphas.latitude == 31.7781  # the place's location
    assert _artifact(conn, "pilate-stone").place_slug is None  # Caesarea comes from the OpenBible import
    james = _artifact(conn, "james-ossuary")
    assert james.authenticity == "debated" and james.latitude is None
    assert _artifact(conn, "siloam-inscription").date_label == "about 700 BCE"


def test_only_accepted_artifacts_can_support_a_claim(conn):
    seed(conn)
    claim = _claim(conn)
    _link(conn, claim, "pilate-stone", "supports")
    _link(conn, claim, "james-ossuary", "contextualizes")  # a debated find may give context
    with pytest.raises(DBAPIError, match="Only an accepted artifact"):
        with conn.begin_nested():
            _link(conn, claim, "james-ossuary", "supports")
    with pytest.raises(DBAPIError, match="supports a claim"):
        with conn.begin_nested():
            conn.execute(text("UPDATE artifacts SET authenticity = 'debated' WHERE slug = 'pilate-stone'"))
    assert [c.evidence_role for c in _artifact(conn, "pilate-stone").claims] == ["supports"]


def test_claims_on_unpublished_events_stay_hidden(conn):
    seed(conn)
    _link(conn, _claim(conn, status="draft"), "pilate-stone", "supports")
    assert _artifact(conn, "pilate-stone").claims == []


def test_images_need_a_license(conn):
    seed(conn)
    with pytest.raises(DBAPIError):
        with conn.begin_nested():
            conn.execute(text("UPDATE artifacts SET image_url = 'https://x/y.jpg' WHERE slug = 'pilate-stone'"))


# ------------------------------------------------------------------ Wikidata import

def test_year_range_handles_precision_and_bce():
    assert wd.year_range("0030-01-01T00:00:00Z", 9) == (30, 30)
    assert wd.year_range("0030-01-01T00:00:00Z", 8) == (30, 39)
    assert wd.year_range("0100-01-01T00:00:00Z", 7) == (1, 100)  # 1st century CE
    assert wd.year_range("-0050-01-01T00:00:00Z", 7) == (-99, 0)  # 1st century BCE
    assert wd.year_range("-0699-01-01T00:00:00Z", 6) == (-999, 0)
    assert wd.year_range("0030-01-01T00:00:00Z", 5) == (None, None)


def _b(**kw):
    return {k: {"value": v} for k, v in kw.items()}


ENTITY = "http://www.wikidata.org/entity/"
FINDS = [
    _b(item=ENTITY + "Q900", itemLabel="Ossuary of Shalom", itemDescription="limestone box", place=ENTITY + "Q1218",
       typeLabel="ossuary", time="0050-01-01T00:00:00Z", precision="7", discovered="1980-01-01T00:00:00Z",
       collectionLabel="Some Museum", image="http://commons.wikimedia.org/wiki/Special:FilePath/Box%20one.jpg",
       coord="Point(35.2 31.7)"),
    _b(item=ENTITY + "Q900", itemLabel="Ossuary of Shalom", place=ENTITY + "Q1218", typeLabel="artifact",
       time="0050-01-01T00:00:00Z", precision="7"),
    _b(item=ENTITY + "Q901", itemLabel="Medieval seal", place=ENTITY + "Q1218", typeLabel="seal",
       time="1200-01-01T00:00:00Z", precision="9"),  # too late: skipped
    _b(item=ENTITY + "Q1073819", itemLabel="Pilate Stone", place=ENTITY + "Q1218", typeLabel="inscription",
       time="0030-01-01T00:00:00Z", precision="9"),  # curated: never imported
]
COMMONS = {"query": {
    "normalized": [{"from": "File:Box one.jpg", "to": "File:Box one.jpg"}],
    "pages": {"1": {"title": "File:Box one.jpg", "imageinfo": [{
        "thumburl": "https://upload.wikimedia.org/box.jpg?utm_source=x", "url": "https://upload.wikimedia.org/full.jpg",
        "descriptionurl": "https://commons.wikimedia.org/wiki/File:Box_one.jpg",
        "extmetadata": {"LicenseShortName": {"value": "CC BY-SA 4.0"},
                        "Artist": {"value": '<a href="u">Jane Photographer</a>'}}}]},
              "2": {"title": "File:No license.jpg", "imageinfo": [{"url": "https://x", "descriptionurl": "https://y"}]}}}}


def _fetched():
    finds = {q: it for q, it in wd.parse(FINDS).items() if wd.in_range(it)}
    photos = wd.parse_commons(COMMONS)
    for it in finds.values():
        it.photo = photos.get(it.image_file)
    details = wd.parse([_b(item=ENTITY + "Q1073819", itemLabel="Pilate Stone", collectionLabel="Israel Museum",
                           discovered="1961-01-01T00:00:00Z",
                           image="http://commons.wikimedia.org/wiki/Special:FilePath/Box%20one.jpg")])
    details["Q1073819"].photo = photos["Box one.jpg"]
    return finds, details


def test_region_keeps_the_holy_land_and_leaves_out_far_places():
    assert wd.in_region(31.7781, 35.2354)        # Jerusalem
    assert wd.in_region(32.5, 34.891667)         # Caesarea
    assert wd.in_region(34.12, 35.65)            # Byblos
    assert not wd.in_region(30.13, 31.29)        # Heliopolis, Egypt
    assert not wd.in_region(32.19, 48.25)        # Susa, Iran
    assert not wd.in_region(41.89, 12.49)        # Rome
    assert wd.in_region(None, None)              # no point of its own: its place decides


def test_parse_merges_rows_and_reads_photos():
    finds, _ = _fetched()
    assert set(finds) == {"Q900", "Q1073819"}
    box = finds["Q900"]
    assert (box.slug, box.artifact_type, box.earliest_year, box.latest_year) == ("ossuary-of-shalom-q900", "ossuary", 1, 100)
    assert (box.lat, box.lon, box.year_discovered, box.museum) == (31.7, 35.2, 1980, "Some Museum")
    assert box.photo == wd.Photo("https://upload.wikimedia.org/box.jpg", "CC BY-SA 4.0", "Jane Photographer",
                                 "https://commons.wikimedia.org/wiki/File:Box_one.jpg")
    assert "No license.jpg" not in wd.parse_commons(COMMONS)


def test_save_imports_new_finds_and_only_fills_empty_curated_fields(conn):
    seed_places(conn)
    seed(conn)
    finds, details = _fetched()
    report = wd.save(conn, finds, details)
    report = wd.save(conn, finds, details)  # repeatable
    assert report == {"imported": 1, "skipped_curated": 1, "removed": 0, "curated_enriched": 1}

    box = _artifact(conn, "ossuary-of-shalom-q900")
    assert box.authenticity == "unreviewed" and box.data_source == "wikidata" and box.place_slug == "jerusalem"
    assert box.image_license == "CC BY-SA 4.0" and box.image_credit == "Jane Photographer"

    pilate = _artifact(conn, "pilate-stone")
    assert pilate.museum == "Israel Museum, Jerusalem"  # curated value kept
    assert pilate.name == "Pilate Stone" and pilate.description.startswith("A limestone block")
    assert pilate.image_url == "https://upload.wikimedia.org/box.jpg"  # empty field filled

    # A later run where the find is gone removes it, but only when every batch succeeded.
    assert wd.save(conn, {}, {}, complete=False)["removed"] == 0
    assert wd.save(conn, {}, {}, complete=True)["removed"] == 1


# ------------------------------------------------------------------ export and endpoint

def test_export_writes_the_same_json_as_the_api(conn, tmp_path):
    seed_places(conn)
    seed(conn)
    assert export(conn, tmp_path) == {"places": 5, "artifacts": 7}
    app.dependency_overrides[get_conn] = lambda: conn
    try:
        client = TestClient(app)
        assert json.loads((tmp_path / "places.json").read_text()) == client.get("/api/v1/places").json()
        assert json.loads((tmp_path / "places" / "emmaus.json").read_text()) == client.get("/api/v1/places/emmaus").json()
        exported = json.loads((tmp_path / "artifacts.json").read_text())
        assert exported == client.get("/api/v1/artifacts").json()
        assert exported[0]["slug"] == "siloam-inscription"  # curated first, oldest first
    finally:
        app.dependency_overrides.clear()

    # Places removed from the database disappear from the export.
    (tmp_path / "places" / "old-place.json").write_text("{}")
    export(conn, tmp_path)
    assert not (tmp_path / "places" / "old-place.json").exists()
