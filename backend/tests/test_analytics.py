import json

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.database import get_conn
from app.main import app
from scripts.analytics_report import report


def _client(conn):
    app.dependency_overrides[get_conn] = lambda: conn
    return TestClient(app)


def _post(client, events):
    # Sent as text/plain, the way navigator.sendBeacon sends it.
    return client.post("/api/v1/analytics", content=json.dumps({"events": events}),
                       headers={"Content-Type": "text/plain"})


def test_counts_views_and_clicks_as_daily_totals(conn):
    try:
        client = _client(conn)
        assert _post(client, [
            {"kind": "view", "path": "/map"},
            {"kind": "view", "path": "/map"},
            {"kind": "click", "path": "/map", "target": "  Emmaus  "},
            {"kind": "view", "path": "/mass", "target": "ignored for views"},
        ]).status_code == 204
        _post(client, [{"kind": "click", "path": "/map", "target": "Emmaus"}])
        rows = conn.execute(text("SELECT kind, path, target, count FROM analytics_daily ORDER BY kind, path")).all()
        assert rows == [("click", "/map", "Emmaus", 2), ("view", "/map", "", 2), ("view", "/mass", "", 1)]
        r = report(conn, days=1)
        assert r["views"][0][0] == "/map" and r["clicks"][0][1] == "Emmaus"
    finally:
        app.dependency_overrides.clear()


def test_rejects_bad_input(conn):
    try:
        client = _client(conn)
        assert _post(client, [{"kind": "purchase", "path": "/map"}]).status_code == 422
        assert _post(client, [{"kind": "view", "path": "https://evil.example/"}]).status_code == 422
        assert _post(client, [{"kind": "view", "path": "/map?email=a@b.c"}]).status_code == 422
        assert client.post("/api/v1/analytics", content="not json").status_code == 422
        assert _post(client, [{"kind": "view", "path": "/x"}] * 51).status_code == 422
        assert conn.execute(text("SELECT count(*) FROM analytics_daily")).scalar_one() == 0
    finally:
        app.dependency_overrides.clear()
