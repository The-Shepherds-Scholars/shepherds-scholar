from fastapi.testclient import TestClient

from app.core.database import get_conn
from app.main import app
from tests.conftest import add_passage, add_verses


def test_passage_endpoint(conn):
    add_verses(conn, "JHN", 3, [(16, "For God so loved the world")])
    pid = add_passage(conn, "JHN", 3, 16, label="John 3:16")
    app.dependency_overrides[get_conn] = lambda: conn
    try:
        client = TestClient(app)
        r = client.get(f"/api/v1/passages/{pid}")
        assert r.status_code == 200
        body = r.json()
        assert body["translation_code"] == "DRC" and body["verses"][0]["text"].startswith("For God")
        assert body["reference"] == "John 3:16" and body["book"]["original_language"] == "Greek"
        assert client.get(f"/api/v1/passages/{pid}?translation=NOPE").status_code == 404
        day = client.get("/api/v1/readings/2026-10-29").json()
        assert day["available"] is False and day["source_url"].startswith("https://bible.usccb.org/")
    finally:
        app.dependency_overrides.clear()
