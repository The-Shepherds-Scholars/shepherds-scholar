"""Write the map's data as static JSON files that Cloudflare serves with the website.

    python -m scripts.export_static_data                  # writes ../frontend/public/data
    python -m scripts.export_static_data path/to/folder   # or anywhere else

Files written (the same JSON the API returns, so the site can use either):
    places.json            every place          (GET /api/v1/places)
    places/<slug>.json     one place's details  (GET /api/v1/places/<slug>)
    artifacts.json         every artifact       (GET /api/v1/artifacts)

Why: the map's data only changes when an import runs, so there is no reason for every visitor to wake
the Render server and Neon. Static files on Cloudflare are free, never sleep, and handle any number of
visitors. The weekly GitHub Actions workflow runs this after the imports and commits the files, which
makes Cloudflare rebuild the site.

The output has no timestamps, so a run that changes no data changes no files and makes no commit.
"""

import json
import shutil
import sys
from pathlib import Path

from sqlalchemy import Connection

from app.routers.artifacts import ArtifactOut
from app.routers.places import PlaceDetailOut, PlaceOut
from app.services import artifacts, places

DEFAULT_OUT = Path(__file__).resolve().parents[2] / "frontend" / "public" / "data"


def _write(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def export(conn: Connection, out: Path) -> dict[str, int]:
    out.mkdir(parents=True, exist_ok=True)
    summaries = places.list_places(conn)
    _write(out / "places.json", [PlaceOut(**p.__dict__).model_dump(mode="json") for p in summaries])

    # Rebuild the details folder so places that were removed don't linger.
    detail_dir = out / "places"
    shutil.rmtree(detail_dir, ignore_errors=True)
    detail_dir.mkdir()
    for s in summaries:
        p = places.get_place(conn, s.slug)
        detail = PlaceDetailOut(
            **{k: v for k, v in p.__dict__.items() if k not in ("candidates", "passages", "events")},
            candidates=[c.__dict__ for c in p.candidates],
            passages=[x.__dict__ for x in p.passages],
            events=[e.__dict__ for e in p.events],
        )
        _write(detail_dir / f"{s.slug}.json", detail.model_dump(mode="json"))

    found = artifacts.list_artifacts(conn)
    _write(out / "artifacts.json", [
        ArtifactOut(**{**a.__dict__, "claims": [c.__dict__ for c in a.claims]}).model_dump(mode="json")
        for a in found
    ])
    return {"places": len(summaries), "artifacts": len(found)}


def main() -> None:
    from app.core.database import engine

    out = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT
    with engine.connect() as conn:
        print({"out": str(out), **export(conn, out)})


if __name__ == "__main__":
    main()
