"""Thin API.Bible client. Used only by background jobs, never by request handlers.

Every call is written to external_api_calls, and calls stop once the month's
budget (Settings.api_bible_monthly_budget) is spent.
"""

from dataclasses import dataclass

import httpx
from sqlalchemy import Connection, text

from app.core.config import get_settings
from app.services.versification import Ref

PROVIDER = "api_bible"


class BudgetExhausted(Exception):
    pass


class UnsupportedReference(Exception):
    """The reference cannot be expressed as an API.Bible passage or chapter id."""


class ApiBibleError(Exception):
    def __init__(self, status: int | None, message: str):
        super().__init__(message)
        self.status = status


@dataclass
class FetchedPassage:
    reference_label: str
    content: str
    copyright: str
    fums_token: str | None


def api_bible_path(bible_id: str, ref: Ref) -> str:
    """Build the request path for a reference (book codes are already USFM, as API.Bible uses)."""
    b = ref.book
    if ref.verse_start is None:
        if ref.chapter_start != ref.chapter_end:
            raise UnsupportedReference("whole multi-chapter ranges need explicit verses")
        return f"/bibles/{bible_id}/chapters/{b}.{ref.chapter_start}"
    if ref.verse_end is None:
        raise UnsupportedReference("open-ended verse ranges need an end verse")
    start = f"{b}.{ref.chapter_start}.{ref.verse_start}"
    end = f"{b}.{ref.chapter_end}.{ref.verse_end}"
    if start == end:
        return f"/bibles/{bible_id}/verses/{start}"
    return f"/bibles/{bible_id}/passages/{start}-{end}"


def calls_this_month(conn: Connection) -> int:
    return conn.execute(
        text("""SELECT count(*) FROM external_api_calls
                WHERE provider = :p AND called_at >= date_trunc('month', now())"""),
        {"p": PROVIDER},
    ).scalar_one()


def _log(conn: Connection, endpoint: str, status: int | None, ok: bool) -> None:
    conn.execute(
        text("""INSERT INTO external_api_calls (provider, endpoint, status_code, succeeded)
                VALUES (:p, :e, :s, :ok)"""),
        {"p": PROVIDER, "e": endpoint, "s": status, "ok": ok},
    )


class ApiBibleClient:
    def __init__(self, conn: Connection, http: httpx.Client | None = None):
        settings = get_settings()
        if not settings.api_bible_key:
            raise RuntimeError("API_BIBLE_KEY is not set")
        self.conn = conn
        self.budget = settings.api_bible_monthly_budget
        self.http = http or httpx.Client(
            base_url=settings.api_bible_base_url,
            headers={"api-key": settings.api_bible_key},
            timeout=15.0,
        )

    def remaining_budget(self) -> int:
        return max(0, self.budget - calls_this_month(self.conn))

    def fetch(self, bible_id: str, ref: Ref) -> FetchedPassage:
        path = api_bible_path(bible_id, ref)
        if self.remaining_budget() <= 0:
            raise BudgetExhausted(f"monthly budget of {self.budget} calls used")

        params = {"content-type": "text", "include-notes": "false", "include-titles": "false",
                  "include-verse-numbers": "true"}
        try:
            resp = self.http.get(path, params=params)
        except httpx.HTTPError as exc:
            _log(self.conn, path, None, False)
            raise ApiBibleError(None, str(exc)) from exc

        _log(self.conn, path, resp.status_code, resp.is_success)
        if not resp.is_success:
            raise ApiBibleError(resp.status_code, resp.text[:200])

        body = resp.json()
        data, meta = body.get("data", {}), body.get("meta", {})
        return FetchedPassage(
            reference_label=data.get("reference", ""),
            content=data.get("content", "").strip(),
            copyright=data.get("copyright", "").strip(),
            # Newer responses use fumsToken; older ones fumsId.
            fums_token=meta.get("fumsToken") or meta.get("fumsId"),
        )
