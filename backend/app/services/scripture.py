"""Scripture read path. Serves a passage without ever calling an external API.

Order of preference for a request (passage, translation):
  1. A local translation (Douay-Rheims): read from local_verses.
  2. An API.Bible translation with a cache row younger than cache_max_age_days.
  3. Otherwise fall back to the default local translation and say so.

The background job in app/jobs/refresh_passage_cache.py is the only code that
fills passage_cache.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import Connection, text

from app.core.config import get_settings
from app.services.versification import Ref, convert


class PassageNotFound(Exception):
    pass


class TranslationNotFound(Exception):
    pass


@dataclass
class Translation:
    code: str
    name: str
    source: str
    api_bible_id: str | None
    versification: str
    license: str
    copyright_notice: str | None
    translated_from: str | None = None
    includes_deuterocanon: bool = True
    citation: str | None = None  # full API.Bible citation, for the Sources page
    citation_short: str | None = None  # short form, shown under each passage


@dataclass
class BookInfo:
    code: str
    name: str
    testament: str  # "OT" or "NT"
    canon_status: str  # "protocanonical" or "deuterocanonical"
    original_language: str
    language_note: str | None


@dataclass
class Verse:
    chapter: int
    verse: int
    text: str


@dataclass
class PassageText:
    reference: str  # always built from the book name, e.g. "Romans 8:31–39"
    book: BookInfo
    translation_reference: str | None  # set when the translation numbers it differently
    translated_from: str | None
    translation_code: str
    translation_name: str
    verses: list[Verse] | None  # set for local translations
    content: str | None  # set for cached API.Bible text
    copyright: str | None
    fums_token: str | None  # the frontend reports this to FUMS on display
    fetched_at: datetime | None
    fell_back: bool  # True when the requested translation could not be served
    notice: str | None
    citation: str | None = None  # API.Bible citation (short form) for the translation shown


def ref_from_row(row) -> Ref:
    """Normalize a scripture_passages row into an explicit range."""
    ch_end = row.chapter_end or row.chapter_start
    if row.verse_start is None:
        return Ref(row.book_code, row.chapter_start, None, ch_end, None)
    if row.verse_end is None and row.chapter_end is None:
        return Ref(row.book_code, row.chapter_start, row.verse_start, row.chapter_start, row.verse_start)
    return Ref(row.book_code, row.chapter_start, row.verse_start, ch_end, row.verse_end)


def get_translation(conn: Connection, code: str | None) -> Translation:
    if code is None:
        row = conn.execute(text("SELECT * FROM bible_translations WHERE is_default")).first()
    else:
        row = conn.execute(
            text("SELECT * FROM bible_translations WHERE code = :code AND enabled"), {"code": code}
        ).first()
    if row is None:
        raise TranslationNotFound(code or "default")
    return _translation(row)


def _translation(r) -> Translation:
    return Translation(r.code, r.name, r.source, r.api_bible_id, r.versification,
                       r.license, r.copyright_notice, r.translated_from, r.includes_deuterocanon,
                       r.citation, r.citation_short)


def get_book(conn: Connection, code: str) -> BookInfo:
    r = conn.execute(text("SELECT * FROM canon_books WHERE code = :c"), {"c": code}).one()
    return BookInfo(r.code, r.name, r.testament, r.canon_status, r.original_language, r.language_note)


def format_reference(book_name: str, ref: Ref) -> str:
    """'Romans 8:31–39', 'John 3:16', 'Genesis 12', 'Psalm 23:1–2', 'Mark 15:42–16:8'."""
    name = "Psalm" if book_name == "Psalms" and ref.chapter_start == ref.chapter_end else book_name
    c1, v1, c2, v2 = ref.chapter_start, ref.verse_start, ref.chapter_end, ref.verse_end
    if v1 is None or (v1 == 1 and v2 is None):  # whole chapters
        return f"{name} {c1}" if c1 == c2 else f"{name} {c1}–{c2}"
    if c1 == c2:
        if v2 is None:
            return f"{name} {c1}:{v1}–end"
        return f"{name} {c1}:{v1}" if v1 == v2 else f"{name} {c1}:{v1}–{v2}"
    return f"{name} {c1}:{v1}–{c2}:{v2}" if v2 is not None else f"{name} {c1}:{v1}–{c2}"


def list_translations(conn: Connection) -> list[Translation]:
    rows = conn.execute(
        text("SELECT * FROM bible_translations WHERE enabled ORDER BY is_default DESC, name")
    ).all()
    return [_translation(r) for r in rows]


def _passage_row(conn: Connection, passage_id: UUID):
    row = conn.execute(
        text("SELECT * FROM scripture_passages WHERE id = :id"), {"id": passage_id}
    ).first()
    if row is None:
        raise PassageNotFound(str(passage_id))
    return row


def _local_verses(conn: Connection, translation: Translation, ref: Ref) -> list[Verse]:
    rows = conn.execute(
        text("""
            SELECT chapter, verse, text FROM local_verses
            WHERE translation_code = :tr AND book_code = :book
              AND (chapter, verse) >= (:c1, :v1)
              AND (chapter < :c2 OR (chapter = :c2 AND (CAST(:v2 AS integer) IS NULL OR verse <= :v2)))
            ORDER BY chapter, verse
        """),
        {"tr": translation.code, "book": ref.book, "c1": ref.chapter_start,
         "v1": ref.verse_start or 1, "c2": ref.chapter_end, "v2": ref.verse_end},
    ).all()
    return [Verse(r.chapter, r.verse, r.text) for r in rows]


def _labels(conn, passage, translation: Translation):
    """Book info, the reader-facing reference, and the translation's own numbering when it differs."""
    book = get_book(conn, passage.book_code)
    original = ref_from_row(passage)
    converted = convert(original, passage.versification, translation.versification)
    reference = format_reference(book.name, original)
    own = format_reference(book.name, converted)
    return book, reference, (own if own != reference else None), converted


def _serve_local(conn, passage, translation: Translation, *, fell_back=False, notice=None) -> PassageText:
    book, reference, translation_reference, ref = _labels(conn, passage, translation)
    return PassageText(
        reference=reference,
        book=book,
        translation_reference=translation_reference,
        translated_from=translation.translated_from,
        translation_code=translation.code,
        translation_name=translation.name,
        verses=_local_verses(conn, translation, ref),
        content=None,
        copyright=translation.copyright_notice,
        fums_token=None,
        fetched_at=None,
        fell_back=fell_back,
        notice=notice,
    )


def get_passage(conn: Connection, passage_id: UUID, translation_code: str | None = None,
                now: datetime | None = None) -> PassageText:
    now = now or datetime.now(timezone.utc)
    passage = _passage_row(conn, passage_id)
    translation = get_translation(conn, translation_code)

    if translation.source == "local":
        return _serve_local(conn, passage, translation)

    max_age = timedelta(days=get_settings().cache_max_age_days)
    cached = conn.execute(
        text("""SELECT * FROM passage_cache
                WHERE passage_id = :pid AND translation_code = :tr AND fetched_at > :cutoff"""),
        {"pid": passage_id, "tr": translation.code, "cutoff": now - max_age},
    ).first()
    if cached:
        book, reference, translation_reference, _ = _labels(conn, passage, translation)
        return PassageText(
            reference=reference,
            book=book,
            translation_reference=translation_reference,
            translated_from=translation.translated_from,
            translation_code=translation.code,
            translation_name=translation.name,
            verses=None,
            content=cached.content,
            copyright=cached.copyright,
            fums_token=cached.fums_token,
            fetched_at=cached.fetched_at,
            fell_back=False,
            notice=None,
            citation=translation.citation_short,
        )

    default = get_translation(conn, None)
    book = get_book(conn, passage.book_code)
    if book.canon_status == "deuterocanonical" and not translation.includes_deuterocanon:
        notice = (f"The {translation.name} doesn’t include {book.name}, one of the deuterocanonical "
                  f"books found in Catholic Bibles, so it’s shown in the {default.name}.")
    else:
        notice = f"{translation.name} isn’t available for this passage yet, so it’s shown in the {default.name}."
    return _serve_local(conn, passage, default, fell_back=True, notice=notice)
