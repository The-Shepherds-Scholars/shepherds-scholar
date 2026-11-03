from datetime import date, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import Connection

from app.core.database import get_conn
from app.services import readings

router = APIRouter(prefix="/api/v1/readings", tags=["readings"])


class ReadingRefOut(BaseModel):
    section: str
    reference: str


class MassOut(BaseModel):
    mass_type: str
    title: str
    source_url: str
    readings: list[ReadingRefOut]
    fetched_at: datetime | None


class DayOut(BaseModel):
    date: date
    available: bool
    masses: list[MassOut]
    source_url: str  # always present, so the app can link out even when nothing is stored


def _day(conn: Connection, day: date) -> DayOut:
    stored = readings.get_for_date(conn, day)
    fallback_url = stored[0].source_url if stored else readings.UsccbProvider().source_url(day)
    return DayOut(
        date=day,
        available=bool(stored),
        masses=[MassOut(mass_type=m.mass_type, title=m.title, source_url=m.source_url,
                        readings=[r.__dict__ for r in m.readings], fetched_at=m.fetched_at) for m in stored],
        source_url=fallback_url,
    )


@router.get("/today", response_model=DayOut)
def today(conn: Connection = Depends(get_conn)):
    return _day(conn, date.today())


@router.get("/{day}", response_model=DayOut)
def by_date(day: date, conn: Connection = Depends(get_conn)):
    return _day(conn, day)
