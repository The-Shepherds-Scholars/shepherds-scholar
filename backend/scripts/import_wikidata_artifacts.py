"""Import artifacts from Wikidata: finds made at the places on the map, plus photos for curated ones.

    python -m scripts.import_wikidata_artifacts

Run by the weekly "Weekly data" GitHub Actions workflow, never while a visitor waits. Safe to re-run.

What it does:
  1. For every place with a wikidata_id inside REGION (the Holy Land and its neighbors), asks the Wikidata Query Service for items whose "location of
     discovery" (P189) is that place and that have an "inception" date (P571). Items dated outside
     YEAR_MIN..YEAR_MAX (Bible times through the early Church) are skipped, and so are items whose
     own coordinates fall outside REGION. Places farther away (Egypt, Mesopotamia, Rome) are left
     out on purpose: Wikidata lists thousands of museum objects from them that say nothing about
     the Bible, and every visitor would download them. Finds from those places can be added by hand.
     Items with no English name are skipped too.
  2. Saves them with data_source='wikidata' and authenticity='unreviewed', so the site shows them as
     "Being checked" until a person reviews each one. Matched by Wikidata id (source_ref).
  3. Fills the EMPTY fields of curated artifacts (photo, museum, find spot, year found) from Wikidata.
     Curated text is never overwritten, and a Wikidata item that is curated is never imported twice.
  4. Looks up each photo's license and author on Wikimedia Commons. A photo is stored only with its
     license, credit, and the link to its Commons page.

Wikidata data is CC0. Commons photos carry their own licenses, stored with each photo.
The Query Service limits heavy use, so places are sent in batches with a pause between them and a
descriptive User-Agent (no personal contact details).
"""

import re
import sys
import time
from dataclasses import dataclass, field
from urllib.parse import unquote

import httpx
from sqlalchemy import Connection, text

SPARQL_URL = "https://query.wikidata.org/sparql"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "ShepherdsScholarBot/1.0 (https://github.com/The-Shepherds-Scholars/shepherds-scholar)"
YEAR_MIN, YEAR_MAX = -3000, 700  # astronomical years
BATCH = 40  # places per query
PAUSE = 1.0  # seconds between queries
IMAGE_WIDTH = 640
# Where finds are imported from: (south, west, north, east) in degrees. Covers Israel, the
# Palestinian territories, western Jordan, southern Lebanon and Syria (Tyre, Sidon, Byblos,
# Damascus), and the northern Sinai. Widen it here; the next weekly run imports the new area.
REGION = (29.5, 33.8, 34.5, 37.0)

# Finds at these places. Rows repeat per type/collection/image; parse() merges them per item.
FINDS_QUERY = """
SELECT ?item ?itemLabel ?itemDescription ?place ?typeLabel ?time ?precision ?earliest ?latest
       ?discovered ?collectionLabel ?website ?image ?coord WHERE {
  VALUES ?place { %s }
  ?item wdt:P189 ?place ;
        p:P571 ?st .
  ?st psv:P571 [ wikibase:timeValue ?time ; wikibase:timePrecision ?precision ] .
  OPTIONAL { ?st pq:P1319 ?earliest }
  OPTIONAL { ?st pq:P1326 ?latest }
  OPTIONAL { ?item wdt:P31 ?type }
  OPTIONAL { ?item wdt:P575 ?discovered }
  OPTIONAL { ?item wdt:P195 ?collection . OPTIONAL { ?collection wdt:P856 ?website } }
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?item wdt:P625 ?coord }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
"""

# Details for curated artifacts, by their own Wikidata ids.
DETAILS_QUERY = """
SELECT ?item ?itemLabel ?place ?discovered ?collectionLabel ?website ?image ?coord WHERE {
  VALUES ?item { %s }
  OPTIONAL { ?item wdt:P189 ?place }
  OPTIONAL { ?item wdt:P575 ?discovered }
  OPTIONAL { ?item wdt:P195 ?collection . OPTIONAL { ?collection wdt:P856 ?website } }
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?item wdt:P625 ?coord }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
"""

TYPE_WORDS = [  # first match on the English label of "instance of" wins
    ("inscription", ("inscription", "stele", "stela", "epitaph", "ostracon", "tablet", "seal", "bulla")),
    ("coin", ("coin", "hoard", "shekel", "denarius", "prutah")),
    ("ossuary", ("ossuary", "sarcophagus", "coffin")),
    ("manuscript", ("manuscript", "scroll", "codex", "papyrus", "parchment", "fragment")),
    ("building", ("building", "synagogue", "church", "temple", "tomb", "pool", "palace", "house",
                  "fortress", "wall", "gate", "aqueduct", "theatre", "theater", "mosaic")),
]
QID = re.compile(r"Q[0-9]+$")
POINT = re.compile(r"Point\(([-0-9.eE]+) ([-0-9.eE]+)\)")
TAG = re.compile(r"<[^>]+>")


@dataclass
class Photo:
    url: str
    license: str
    credit: str | None
    source_url: str


@dataclass
class WikidataItem:
    qid: str
    name: str
    description: str | None = None
    place_qid: str | None = None
    types: list[str] = field(default_factory=list)
    earliest_year: int | None = None
    latest_year: int | None = None
    year_discovered: int | None = None
    museum: str | None = None
    museum_url: str | None = None
    image_file: str | None = None
    lat: float | None = None
    lon: float | None = None
    photo: Photo | None = None

    @property
    def artifact_type(self) -> str:
        for kind, words in TYPE_WORDS:
            if any(w in t.lower() for t in self.types for w in words):
                return kind
        return "object"

    @property
    def slug(self) -> str:
        base = re.sub(r"[^a-z0-9]+", "-", self.name.lower()).strip("-")[:120] or "artifact"
        return f"{base}-{self.qid.lower()}"


# ------------------------------------------------------------------ parsing (no network)

def _qid(uri: str | None) -> str | None:
    tail = (uri or "").rsplit("/", 1)[-1]
    return tail if QID.fullmatch(tail) else None


def _year(value: str | None) -> int | None:
    """Year of an xsd:dateTime from the Query Service. Its RDF uses astronomical years (0 = 1 BCE)."""
    m = re.match(r"^(-?)0*(\d+)-", value or "")
    return (-int(m.group(2)) if m.group(1) else int(m.group(2))) if m else None


def year_range(value: str | None, precision: int | None) -> tuple[int | None, int | None]:
    """Turn a Wikidata time and its precision (9 year, 8 decade, 7 century, 6 millennium) into a span."""
    y = _year(value)
    if y is None or precision is None or precision < 6:
        return None, None
    if precision >= 9:
        return y, y
    if precision == 8:
        start = y - y % 10
        return start, start + 9
    size = 100 if precision == 7 else 1000
    if y > 0:  # the 1st century CE is 1..100
        n = -(-y // size)
        return size * (n - 1) + 1, size * n
    bce = 1 - y  # the 1st century BCE is 100 BCE..1 BCE, astronomical -99..0
    n = -(-bce // size)
    return 1 - size * n, -size * (n - 1)


def _file_name(image_uri: str | None) -> str | None:
    if not image_uri or "Special:FilePath/" not in image_uri:
        return None
    return unquote(image_uri.split("Special:FilePath/", 1)[1]).replace("_", " ")


def parse(bindings: list[dict]) -> dict[str, WikidataItem]:
    """Merge Query Service rows into one item per Wikidata id. The first value seen for a field wins."""
    items: dict[str, WikidataItem] = {}
    for b in bindings:
        v = {k: x.get("value") for k, x in b.items()}
        qid = _qid(v.get("item"))
        if not qid:
            continue
        it = items.get(qid)
        if it is None:
            label = v.get("itemLabel") or qid
            it = items[qid] = WikidataItem(qid, label[:200], v.get("itemDescription"))
        it.place_qid = it.place_qid or _qid(v.get("place"))
        if v.get("typeLabel") and v["typeLabel"] not in it.types:
            it.types.append(v["typeLabel"])
        if it.earliest_year is None and v.get("time"):
            lo, hi = year_range(v["time"], int(v["precision"]) if v.get("precision") else None)
            lo, hi = _year(v.get("earliest")) or lo, _year(v.get("latest")) or hi
            if lo is not None and hi is not None and lo > hi:
                lo, hi = hi, lo
            it.earliest_year, it.latest_year = lo, hi
        it.year_discovered = it.year_discovered or _year(v.get("discovered"))
        if not it.museum and v.get("collectionLabel") and not QID.fullmatch(v["collectionLabel"]):
            it.museum, it.museum_url = v["collectionLabel"][:200], v.get("website")
        it.image_file = it.image_file or _file_name(v.get("image"))
        if it.lat is None and (m := POINT.fullmatch(v.get("coord") or "")):
            lon, lat = float(m.group(1)), float(m.group(2))
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                it.lat, it.lon = lat, lon
    return items


def in_region(lat: float | None, lon: float | None) -> bool:
    """True when a point is inside REGION. A missing point counts as inside (the place decides)."""
    if lat is None or lon is None:
        return True
    south, west, north, east = REGION
    return south <= lat <= north and west <= lon <= east


def in_range(it: WikidataItem) -> bool:
    if it.earliest_year is None or it.latest_year is None:
        return False
    return it.latest_year >= YEAR_MIN and it.earliest_year <= YEAR_MAX


def parse_commons(data: dict) -> dict[str, Photo]:
    """Photo URL, license, and credit per file name, from a Commons imageinfo response."""
    renamed = {n["to"]: n["from"] for n in (data.get("query") or {}).get("normalized") or []}
    photos = {}
    for page in ((data.get("query") or {}).get("pages") or {}).values():
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            continue
        meta = info.get("extmetadata") or {}
        license_ = (meta.get("LicenseShortName") or {}).get("value")
        url = (info.get("thumburl") or info.get("url") or "").split("?", 1)[0]  # drop Commons' utm_ tracking
        if not license_ or not url or not info.get("descriptionurl"):
            continue  # no license, no photo
        credit = TAG.sub("", (meta.get("Artist") or {}).get("value") or "").strip() or None
        title = renamed.get(page["title"], page["title"])
        photos[title.removeprefix("File:").replace("_", " ")] = Photo(
            url, license_[:120], credit[:500] if credit else None, info["descriptionurl"])
    return photos


# ------------------------------------------------------------------ network

def _get(client: httpx.Client, url: str, params: dict) -> dict:
    for attempt in range(4):
        r = client.get(url, params=params)
        if r.status_code in (429, 500, 502, 503, 504) and attempt < 3:
            wait = r.headers.get("Retry-After", "")
            time.sleep(int(wait) if wait.isdigit() else 5 * (attempt + 1))
            continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError("unreachable")


def sparql(client: httpx.Client, query: str) -> list[dict]:
    return _get(client, SPARQL_URL, {"query": query, "format": "json"})["results"]["bindings"]


def fetch_photos(client: httpx.Client, files: list[str]) -> dict[str, Photo]:
    photos: dict[str, Photo] = {}
    for i in range(0, len(files), 50):  # Commons allows 50 titles per request
        data = _get(client, COMMONS_API, {
            "action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|extmetadata",
            "iiurlwidth": IMAGE_WIDTH, "iiextmetadatafilter": "LicenseShortName|Artist",
            "titles": "|".join(f"File:{f}" for f in files[i:i + 50]),
        })
        photos.update(parse_commons(data))
        time.sleep(PAUSE)
    return photos


def fetch(client: httpx.Client, place_qids: list[str], curated_qids: list[str]) -> tuple[dict, dict, bool]:
    """Returns (finds, curated details, complete). complete is False if any batch failed."""
    finds: dict[str, WikidataItem] = {}
    complete = True
    for i in range(0, len(place_qids), BATCH):
        values = " ".join(f"wd:{q}" for q in place_qids[i:i + BATCH])
        try:
            finds.update(parse(sparql(client, FINDS_QUERY % values)))
        except (httpx.HTTPError, KeyError, ValueError) as e:
            print(f"Batch {i // BATCH + 1} failed: {e}", file=sys.stderr)
            complete = False
        time.sleep(PAUSE)
    # An item with no English label comes back named by its id ("Q16963764"): nothing to show a visitor.
    finds = {q: it for q, it in finds.items()
             if in_range(it) and in_region(it.lat, it.lon) and not QID.match(it.name)}
    details = parse(sparql(client, DETAILS_QUERY % " ".join(f"wd:{q}" for q in curated_qids))) if curated_qids else {}

    files = sorted({it.image_file for it in [*finds.values(), *details.values()] if it.image_file})
    photos = fetch_photos(client, files) if files else {}
    for it in [*finds.values(), *details.values()]:
        it.photo = photos.get(it.image_file) if it.image_file else None
    return finds, details, complete


# ------------------------------------------------------------------ database

def _photo_params(it: WikidataItem) -> dict:
    p = it.photo
    return {"image_url": p.url if p else None, "image_license": p.license if p else None,
            "image_credit": p.credit if p else None, "image_source_url": p.source_url if p else None}


def save(conn: Connection, finds: dict[str, WikidataItem], details: dict[str, WikidataItem],
         complete: bool = True) -> dict[str, int]:
    # A Wikidata id can belong to more than one place; prefer the curated place.
    place_ids: dict[str, object] = {}
    for r in conn.execute(text("""SELECT wikidata_id, id FROM places WHERE wikidata_id IS NOT NULL
                                   ORDER BY (data_source = 'curated') DESC, slug""")):
        place_ids.setdefault(r.wikidata_id, r.id)
    curated = set(conn.execute(text(
        "SELECT wikidata_id FROM artifacts WHERE data_source = 'curated' AND wikidata_id IS NOT NULL")).scalars())

    rows = [
        {"slug": it.slug, "name": it.name, "artifact_type": it.artifact_type,
         "description": it.description, "year_discovered": it.year_discovered,
         "place_id": place_ids.get(it.place_qid), "lat": it.lat, "lon": it.lon,
         "earliest_year": it.earliest_year, "latest_year": it.latest_year,
         "museum": it.museum, "museum_url": it.museum_url, "qid": it.qid,
         "source_url": f"https://www.wikidata.org/wiki/{it.qid}", **_photo_params(it)}
        for it in finds.values() if it.qid not in curated
    ]
    if rows:
        conn.execute(text("""
            INSERT INTO artifacts (slug, name, artifact_type, description, notes_status, authenticity,
                                   year_discovered, found_at_place_id, find_latitude, find_longitude,
                                   earliest_year, latest_year, museum, museum_url, image_url, image_license,
                                   image_credit, image_source_url, data_source, source_ref, source_url,
                                   wikidata_id)
            VALUES (:slug, :name, :artifact_type, :description, 'draft', 'unreviewed',
                    :year_discovered, :place_id, :lat, :lon,
                    :earliest_year, :latest_year, :museum, :museum_url, :image_url, :image_license,
                    :image_credit, :image_source_url, 'wikidata', :qid, :source_url, :qid)
            ON CONFLICT (data_source, source_ref) WHERE source_ref IS NOT NULL DO UPDATE SET
                slug = EXCLUDED.slug, name = EXCLUDED.name, artifact_type = EXCLUDED.artifact_type,
                description = EXCLUDED.description, year_discovered = EXCLUDED.year_discovered,
                found_at_place_id = EXCLUDED.found_at_place_id, find_latitude = EXCLUDED.find_latitude,
                find_longitude = EXCLUDED.find_longitude, earliest_year = EXCLUDED.earliest_year,
                latest_year = EXCLUDED.latest_year, museum = EXCLUDED.museum, museum_url = EXCLUDED.museum_url,
                image_url = EXCLUDED.image_url, image_license = EXCLUDED.image_license,
                image_credit = EXCLUDED.image_credit, image_source_url = EXCLUDED.image_source_url,
                source_url = EXCLUDED.source_url
        """), rows)

    removed = 0
    if complete:
        # Items no longer returned (deleted, redated, or moved) go, unless a claim links to them.
        removed = conn.execute(text("""
            DELETE FROM artifacts a WHERE a.data_source = 'wikidata' AND NOT (a.source_ref = ANY(:keep))
              AND NOT EXISTS (SELECT 1 FROM claim_artifacts ca WHERE ca.artifact_id = a.id)
        """), {"keep": [r["qid"] for r in rows]}).rowcount

    # Curated artifacts: fill empty fields only.
    enriched = 0
    for it in details.values():
        if it.qid not in curated:
            continue
        p = {"qid": it.qid, "museum": it.museum, "museum_url": it.museum_url, "lat": it.lat, "lon": it.lon,
             "year": it.year_discovered, "place_id": place_ids.get(it.place_qid), **_photo_params(it)}
        enriched += conn.execute(text("""
            UPDATE artifacts SET
                museum = coalesce(museum, :museum),
                museum_url = coalesce(museum_url, CASE WHEN museum IS NULL OR museum = :museum THEN :museum_url END),
                year_discovered = coalesce(year_discovered, :year),
                found_at_place_id = coalesce(found_at_place_id, :place_id),
                find_latitude = CASE WHEN find_latitude IS NULL THEN :lat ELSE find_latitude END,
                find_longitude = CASE WHEN find_latitude IS NULL THEN :lon ELSE find_longitude END,
                image_url = CASE WHEN image_url IS NULL THEN :image_url ELSE image_url END,
                image_license = CASE WHEN image_url IS NULL THEN :image_license ELSE image_license END,
                image_credit = CASE WHEN image_url IS NULL THEN :image_credit ELSE image_credit END,
                image_source_url = CASE WHEN image_url IS NULL THEN :image_source_url ELSE image_source_url END
            WHERE data_source = 'curated' AND wikidata_id = :qid
        """), p).rowcount
    return {"imported": len(rows), "skipped_curated": len(finds) - len(rows), "removed": removed,
            "curated_enriched": enriched}


def main() -> None:
    from app.core.database import engine

    with engine.connect() as conn:
        south, west, north, east = REGION
        place_qids = sorted(set(conn.execute(text("""
            SELECT wikidata_id FROM places
            WHERE wikidata_id IS NOT NULL
              AND latitude BETWEEN :south AND :north AND longitude BETWEEN :west AND :east
        """), {"south": south, "north": north, "west": west, "east": east}).scalars()))
        curated_qids = sorted(conn.execute(text(
            "SELECT wikidata_id FROM artifacts WHERE data_source = 'curated' AND wikidata_id IS NOT NULL")).scalars())
    # Fetch everything before opening the write transaction, so Neon isn't held open while waiting on Wikidata.
    with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=90) as client:
        finds, details, complete = fetch(client, place_qids, curated_qids)
    with engine.begin() as conn:
        report = save(conn, finds, details, complete)
    print({"places_checked": len(place_qids), "complete": complete, **report})


if __name__ == "__main__":
    main()
