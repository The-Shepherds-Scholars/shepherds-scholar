import json
from datetime import date

import httpx
from sqlalchemy import text

from app.core.config import get_settings
from app.jobs import fetch_daily_readings, refresh_passage_cache
from app.services import readings
from app.services.api_bible import ApiBibleClient, api_bible_path
from app.services.versification import Ref
from tests.conftest import add_passage


def _event_with_passage(conn, pid):
    era = conn.execute(text("INSERT INTO eras (slug, name, sort_order) VALUES ('e', 'E', 1) RETURNING id")).scalar_one()
    ev = conn.execute(text("""INSERT INTO events (era_id, slug, title, summary)
                              VALUES (:e, 'ev', 'Ev', 'S') RETURNING id"""), {"e": era}).scalar_one()
    conn.execute(text("INSERT INTO event_passages (event_id, passage_id) VALUES (:e, :p)"), {"e": ev, "p": pid})


def _client(conn, calls):
    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request.url.path)
        assert request.headers["api-key"] == "test-key"
        return httpx.Response(200, json={
            "data": {"reference": "John 3:16", "content": "  For God so loved...  ", "copyright": "(c) Pub"},
            "meta": {"fumsToken": "tok-xyz"}})
    http = httpx.Client(base_url="https://rest.api.bible/v1", headers={"api-key": "test-key"},
                        transport=httpx.MockTransport(handler))
    return ApiBibleClient(conn, http=http)


def _add_api_translation(conn):
    conn.execute(text("""INSERT INTO bible_translations (code, name, source, api_bible_id, versification, license)
                         VALUES ('RSVCE', 'Test API Bible', 'api_bible', 'abc-01', 'hebrew', 'Licensed')"""))


def test_paths():
    assert api_bible_path("b", Ref("JHN", 3, 16, 3, 16)) == "/bibles/b/verses/JHN.3.16"
    assert api_bible_path("b", Ref("JHN", 3, 16, 3, 18)) == "/bibles/b/passages/JHN.3.16-JHN.3.18"
    assert api_bible_path("b", Ref("GEN", 12, None, 12, None)) == "/bibles/b/chapters/GEN.12"


def test_refresh_fetches_once_and_logs(conn):
    _add_api_translation(conn)
    pid = add_passage(conn, "JHN", 3, 16, label="John 3:16")
    _event_with_passage(conn, pid)
    calls = []
    client = _client(conn, calls)

    r1 = refresh_passage_cache.refresh(conn, client)
    assert r1.fetched == 1 and calls == ["/v1/bibles/abc-01/verses/JHN.3.16"]
    row = conn.execute(text("SELECT content, fums_token FROM passage_cache")).one()
    assert row == ("For God so loved...", "tok-xyz")
    assert conn.execute(text("SELECT count(*) FROM external_api_calls WHERE succeeded")).scalar_one() == 1

    r2 = refresh_passage_cache.refresh(conn, client)  # still fresh: no call
    assert r2.fetched == 0 and len(calls) == 1


def test_refresh_respects_budget(conn, monkeypatch):
    _add_api_translation(conn)
    pid = add_passage(conn, "JHN", 3, 16, label="John 3:16")
    _event_with_passage(conn, pid)
    monkeypatch.setattr(get_settings(), "api_bible_monthly_budget", 0)
    calls = []
    report = refresh_passage_cache.refresh(conn, _client(conn, calls))
    assert report.stopped_for_budget and calls == []


def test_refresh_purges_rows_past_30_days(conn):
    _add_api_translation(conn)
    pid = add_passage(conn, "JHN", 3, 16, label="John 3:16")  # not linked: purge only
    conn.execute(text("""INSERT INTO passage_cache (passage_id, translation_code, content, copyright, fetched_at)
                         VALUES (:p, 'RSVCE', 'x', '(c)', now() - interval '31 days')"""), {"p": pid})
    report = refresh_passage_cache.refresh(conn, _client(conn, []))
    assert report.purged == 1


class FakeProvider:
    name = "fake"

    def __init__(self):
        self.calls = []

    def source_url(self, day):
        return f"https://example.org/{day}"

    def fetch(self, day):
        self.calls.append(day)
        return readings.DayReadings(day, "default", "Thursday of the Thirtieth Week", self.source_url(day),
                                    [readings.ReadingRef("First Reading", "Romans 8:31b-39"),
                                     readings.ReadingRef("Gospel", "Luke 13:31-35")], self.name)


def test_readings_fetched_once_per_date(conn):
    p = FakeProvider()
    today = date(2026, 10, 29)
    r1 = fetch_daily_readings.run(conn, p, today)
    assert len(r1.fetched) == get_settings().readings_days_ahead + 1
    r2 = fetch_daily_readings.run(conn, p, today)
    assert r2.fetched == [] and len(p.calls) == len(r1.fetched)

    stored = readings.get_for_date(conn, today)[0]
    assert [r.reference for r in stored.readings] == ["Romans 8:31b-39", "Luke 13:31-35"]
    raw = conn.execute(text("SELECT readings FROM daily_readings WHERE reading_date = :d"), {"d": today}).scalar_one()
    assert all(set(x) == {"section", "reference"} for x in raw)  # references only, no text
