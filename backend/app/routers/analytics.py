"""POST /api/v1/analytics: add page views and clicks to the daily totals.

Sent by frontend/src/lib/analytics.ts with navigator.sendBeacon. The body is JSON sent as
text/plain, because a beacon can't send application/json across origins (that would need a CORS
preflight). Only daily counts are stored; nothing about the visitor is read or kept.
"""

import json
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field, ValidationError, field_validator
from sqlalchemy import Connection, text

from app.core.database import get_conn

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

MAX_BODY_BYTES = 8_000
PATH_RE = re.compile(r"^/[A-Za-z0-9/_\-]*$")


class Event(BaseModel):
    kind: str = Field(pattern="^(view|click)$")
    path: str = Field(max_length=200)
    target: str = Field(default="", max_length=120)

    @field_validator("path")
    @classmethod
    def plain_path(cls, v: str) -> str:
        if not PATH_RE.match(v):
            raise ValueError("path must be a site path like /map")
        return v

    @field_validator("target")
    @classmethod
    def tidy_target(cls, v: str) -> str:
        return " ".join(v.split())[:120]


class Batch(BaseModel):
    events: list[Event] = Field(max_length=50)


UPSERT = text("""
    INSERT INTO analytics_daily (day, kind, path, target, count)
    VALUES (:day, :kind, :path, :target, :n)
    ON CONFLICT (day, kind, path, target) DO UPDATE SET count = analytics_daily.count + EXCLUDED.count
""")


@router.post("", status_code=204)
async def record(request: Request, conn: Connection = Depends(get_conn)):
    body = await request.body()
    if len(body) > MAX_BODY_BYTES:
        raise HTTPException(413, "Too many events")
    try:
        batch = Batch.model_validate(json.loads(body or b"{}"))
    except (ValueError, ValidationError):
        raise HTTPException(422, "Invalid events")

    # Collapse duplicates in the batch, then add each total once.
    totals: dict[tuple[str, str, str], int] = {}
    for e in batch.events:
        key = (e.kind, e.path, e.target if e.kind == "click" else "")
        totals[key] = totals.get(key, 0) + 1
    if totals:
        day = datetime.now(timezone.utc).date()
        conn.execute(UPSERT, [{"day": day, "kind": k, "path": p, "target": t, "n": n} for (k, p, t), n in totals.items()])
    return Response(status_code=204)
