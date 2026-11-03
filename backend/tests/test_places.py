from fastapi.testclient import TestClient

from app.core.database import get_conn
from app.main import app
from app.services import places
from scripts.seed_places import seed


def test_seed_is_repeatable_and_lists_featured_in_order(conn):
    seed(conn)
    seed(conn)  # second run updates in place, no duplicates
    featured = places.list_places(conn, featured_only=True)
    assert [p.slug for p in featured] == ["jerusalem", "bethlehem", "nazareth", "capernaum", "emmaus"]
    emmaus = next(p for p in featured if p.slug == "emmaus")
    assert emmaus.latitude is None and emmaus.candidate_count == 4
    assert next(p for p in featured if p.slug == "capernaum").name == "Capernaum"


def test_place_detail_has_candidates_passages_and_draft_status(conn):
    seed(conn)
    emmaus = places.get_place(conn, "emmaus")
    assert len(emmaus.candidates) == 4 and emmaus.notes_status == "draft"
    assert [p.reference for p in emmaus.passages] == ["Luke 24:13–35"]
    nazareth = places.get_place(conn, "nazareth")
    assert "Matthew 2:23" in [p.reference for p in nazareth.passages]
    assert nazareth.events == []


def test_places_endpoints(conn):
    seed(conn)
    app.dependency_overrides[get_conn] = lambda: conn
    try:
        client = TestClient(app)
        listed = client.get("/api/v1/places?featured=true").json()
        assert listed[0]["slug"] == "jerusalem" and listed[0]["ancient_name"] == "Hierosolyma"
        detail = client.get("/api/v1/places/jerusalem").json()
        assert detail["location_confidence"] == "certain"
        assert detail["passages"][0]["reference"] == "Luke 19:41–44"
        # Passage ids from the map open in the passage endpoint.
        assert client.get(f"/api/v1/passages/{detail['passages'][0]['id']}").status_code == 200
        assert client.get("/api/v1/places/atlantis").status_code == 404
    finally:
        app.dependency_overrides.clear()
