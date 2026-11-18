from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import Connection

from app.core.database import get_conn
from app.services import artifacts

router = APIRouter(prefix="/api/v1/artifacts", tags=["artifacts"])


class ArtifactClaimOut(BaseModel):
    statement: str
    claim_type: str
    evidence_role: str
    annotation: str | None
    event_slug: str
    event_title: str


class ArtifactOut(BaseModel):
    slug: str
    name: str
    artifact_type: str
    description: str | None
    significance: str | None
    notes_status: str
    authenticity: str
    authenticity_note: str | None
    year_discovered: int | None
    place_slug: str | None
    place_name: str | None
    latitude: float | None
    longitude: float | None
    earliest_year: int | None
    latest_year: int | None
    date_label: str | None
    museum: str | None
    museum_url: str | None
    image_url: str | None
    image_license: str | None
    image_credit: str | None
    image_source_url: str | None
    data_source: str
    source_url: str | None
    wikidata_id: str | None
    claims: list[ArtifactClaimOut]


@router.get("", response_model=list[ArtifactOut])
def list_artifacts(conn: Connection = Depends(get_conn)):
    """Every artifact. The live site reads the same data from /data/artifacts.json instead."""
    return [ArtifactOut(**{**a.__dict__, "claims": [c.__dict__ for c in a.claims]})
            for a in artifacts.list_artifacts(conn)]
