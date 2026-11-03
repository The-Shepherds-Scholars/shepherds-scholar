from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import Connection

from app.core.database import get_conn
from app.services import places

router = APIRouter(prefix="/api/v1/places", tags=["places"])


class PlaceOut(BaseModel):
    slug: str
    name: str
    ancient_name: str
    modern_name: str | None
    place_type: str
    latitude: float | None
    longitude: float | None
    location_confidence: str
    featured_order: int | None
    candidate_count: int
    data_source: str


class CandidateOut(BaseModel):
    label: str
    latitude: float
    longitude: float
    confidence: str
    note: str | None


class PassageRefOut(BaseModel):
    id: UUID
    reference: str


class EventRefOut(BaseModel):
    slug: str
    title: str


class PlaceDetailOut(PlaceOut):
    notes: str | None
    notes_status: str
    wikidata_id: str | None
    source_url: str | None
    candidates: list[CandidateOut]
    passages: list[PassageRefOut]
    events: list[EventRefOut]


@router.get("", response_model=list[PlaceOut])
def list_places(featured: bool = Query(default=False), conn: Connection = Depends(get_conn)):
    return [PlaceOut(**p.__dict__) for p in places.list_places(conn, featured_only=featured)]


@router.get("/{slug}", response_model=PlaceDetailOut)
def get_place(slug: str, conn: Connection = Depends(get_conn)):
    try:
        p = places.get_place(conn, slug)
    except places.PlaceNotFound:
        raise HTTPException(404, "Place not found")
    return PlaceDetailOut(
        **{k: v for k, v in p.__dict__.items() if k not in ("candidates", "passages", "events")},
        candidates=[c.__dict__ for c in p.candidates],
        passages=[x.__dict__ for x in p.passages],
        events=[e.__dict__ for e in p.events],
    )
