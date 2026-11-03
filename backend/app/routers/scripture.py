from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import Connection

from app.core.database import get_conn
from app.services import scripture

router = APIRouter(prefix="/api/v1", tags=["scripture"])


class TranslationOut(BaseModel):
    code: str
    name: str
    license: str
    translated_from: str | None


class BookOut(BaseModel):
    code: str
    name: str
    testament: str
    canon_status: str
    original_language: str
    language_note: str | None


class VerseOut(BaseModel):
    chapter: int
    verse: int
    text: str


class PassageOut(BaseModel):
    reference: str
    book: BookOut
    translation_reference: str | None
    translated_from: str | None
    translation_code: str
    translation_name: str
    verses: list[VerseOut] | None
    content: str | None
    copyright: str | None
    fums_token: str | None
    fetched_at: datetime | None
    fell_back: bool
    notice: str | None


@router.get("/translations", response_model=list[TranslationOut])
def translations(conn: Connection = Depends(get_conn)):
    return [TranslationOut(code=t.code, name=t.name, license=t.license, translated_from=t.translated_from)
            for t in scripture.list_translations(conn)]


@router.get("/passages/{passage_id}", response_model=PassageOut)
def passage(passage_id: UUID, translation: str | None = Query(default=None, max_length=12),
            conn: Connection = Depends(get_conn)):
    try:
        p = scripture.get_passage(conn, passage_id, translation)
    except scripture.PassageNotFound:
        raise HTTPException(404, "Passage not found")
    except scripture.TranslationNotFound:
        raise HTTPException(404, f"Translation {translation!r} is not available")
    return PassageOut(**{**p.__dict__, "book": p.book.__dict__,
                         "verses": [v.__dict__ for v in p.verses] if p.verses is not None else None})
