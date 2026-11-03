# Backend (`backend/`) and Docker

The API: a FastAPI app in Python. It reads from PostgreSQL (Neon) and returns JSON to the website.
Render runs it in Docker. Two daily jobs fill the database with data from outside services.

**Run it locally** (from `backend/`):

```bash
python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"
cp .env.example .env               # then fill in NEON_DATABASE_URL or use Docker
.venv/bin/alembic upgrade head     # create or update the tables
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

## Design rules

- **Visitors never wait on outside APIs.** Page requests only read the database. Jobs fetch
  API.Bible and USCCB data ahead of time.
- **Scripture is stored as references.** Text comes from the local Douay-Rheims or the API.Bible
  cache when a page asks for it, so translation licensing is handled in one place.
- **Copyrighted text is handled carefully.** Daily readings store references and a link, never the
  reading text. API.Bible text is cached for at most 30 days, with its copyright line, as API.Bible
  requires.
- **Plain SQL.** Queries are written as SQL through SQLAlchemy, not hidden behind an ORM.

## Endpoints

| Method and path | Returns | File |
|---|---|---|
| `GET /api/v1/health` | `{"status": "ok"}`, without touching the database | `app/main.py` |
| `GET /api/v1/translations` | Enabled Bible translations (DRC first) | `app/routers/scripture.py` |
| `GET /api/v1/passages/{id}?translation=NLT` | One passage's text in the requested translation, or the Douay-Rheims with a note | `app/routers/scripture.py` |
| `GET /api/v1/readings/today` | Today's Mass reading references and the USCCB link | `app/routers/readings.py` |
| `GET /api/v1/readings/{YYYY-MM-DD}` | The same for any date | `app/routers/readings.py` |

## `app/`: the API

| File | What it does | Why |
|---|---|---|
| `main.py` | Creates the FastAPI app, adds CORS (which websites may call it), registers the routers, defines `/health` | The entry point Uvicorn runs |
| `core/config.py` | All settings, read from environment variables or `.env`. If `NEON_DATABASE_URL` is set it replaces `DATABASE_URL`, adding the `+psycopg` driver prefix | One typed place for configuration. Neon connection strings can be pasted exactly as Neon gives them |
| `core/database.py` | Creates the database connection pool, and `get_conn()`, which gives each request its own transaction | A failed request never leaves half-written data |
| `routers/scripture.py` | The `/translations` and `/passages` endpoints and their response shapes | Routers only handle HTTP; the logic lives in `services/` |
| `routers/readings.py` | The `/readings` endpoints | Same split |
| `services/scripture.py` | Finds a passage's text: Douay-Rheims from `local_verses`, or API.Bible text from `passage_cache` if under 30 days old, otherwise falls back to the Douay-Rheims and says why | The core reading logic, in one place and tested |
| `services/versification.py` | Converts Psalm numbers between Hebrew numbering (most modern Bibles) and Greek/Latin numbering (the Douay-Rheims) | Psalm 23 in the NLT is Psalm 22 in the Douay-Rheims |
| `services/api_bible.py` | Small API.Bible client. Logs every call, and stops when the monthly budget is used up | Used only by the job, so API.Bible costs never depend on traffic |
| `services/readings.py` | Saves and loads daily readings; the USCCB provider that fetches them | Stores references only, since the lectionary text is copyrighted |

## Daily jobs

They run once a day in GitHub Actions (`.github/workflows/daily-readings.yml`, 10:00 UTC), or by hand
with `python -m …` from `backend/`.

| File | What it does | Why |
|---|---|---|
| `app/jobs/fetch_daily_readings.py` | Fetches readings for today and the next 6 days, skipping dates already stored | A missed day catches up on the next run. USCCB sometimes asks for a browser check, so the workflow installs a headless browser |
| `app/jobs/refresh_passage_cache.py` | Deletes cached API.Bible text over 30 days old, then fetches passages that are missing or over 25 days old, until the monthly budget runs out. Skips deuterocanonical books for translations that lack them | Follows API.Bible's 30-day rule, and refreshes before the deadline |

The workflow needs the GitHub secret `NEON_DATABASE_URL`. The API.Bible step needs `API_BIBLE_KEY`,
and skips itself without it.

## `scripts/`

| File | What it does | Why |
|---|---|---|
| `import_douay_rheims.py` | Loads the Douay-Rheims from `data/DRC.json` into `local_verses`. Safe to re-run. Skips books outside the 73-book Catholic canon | The default translation is stored locally, so it costs nothing to serve and needs no API |

## `alembic/`: database migrations

Each migration is one versioned change to the database. Run `alembic upgrade head` to apply any that
are new. The tables themselves are explained in [database.md](database.md).

| File | What it does |
|---|---|
| `alembic.ini` | Alembic settings. The database address comes from the app's settings, not this file |
| `alembic/env.py` | Connects Alembic to the database using the app's settings |
| `alembic/script.py.mako` | Template for new migration files |
| `versions/core_content_schema.py` | The 73 books, eras, events, people, places, claims, sources, passages, pathways |
| `versions/scripture_text_cache.py` | Translations, Douay-Rheims verses, the API.Bible cache, daily readings, the API call log |
| `versions/book_language_info.py` | Each book's original language, and what each translation was made from |
| `versions/api_bible_nlt_gnt.py` | Adds the NLT and GNT from API.Bible, and whether each translation includes the deuterocanonical books |
| `versions/api_bible_citations.py` | The full and short API.Bible citation for each translation, required for API.Bible translations |

## `tests/`

Run with `.venv/bin/pytest -q`. **The tests delete everything in the database they use**, so they
force `NEON_DATABASE_URL` empty and use `TEST_DATABASE_URL`, which defaults to a local Docker test
database. To test against Neon, create a throwaway Neon branch and point `TEST_DATABASE_URL` at it;
never use the main branch.

| File | What it checks |
|---|---|
| `conftest.py` | Setup: wipes the test database, runs every migration, and turns off the real API.Bible translations. Each test runs in a transaction that is rolled back afterwards |
| `test_api.py` | The endpoints answer correctly over HTTP |
| `test_scripture.py` | Passage lookup, Psalm numbering, the API.Bible cache, the 30-day limit, fallback notes |
| `test_versification.py` | Psalm number conversion, including merged and split psalms |
| `test_jobs.py` | Both daily jobs, using fake API.Bible and USCCB responses |
| `test_import.py` | A full Douay-Rheims import. Skipped unless `data/DRC.json` exists |

## Other files

| File | What it does | Why |
|---|---|---|
| `pyproject.toml` | The package's dependencies; `pip install -e ".[dev]"` installs them plus pytest | One list for Docker, GitHub Actions, and your computer |
| `.env` (not in git) | Your local settings and secrets | Never committed |
| `.env.example` | Every setting, no secrets | Copy to `.env` on first setup |
| `data/` | Holds the downloaded `DRC.json` (about 10 MB); its `.gitignore` keeps it out of git | Too big for the repo, and easy to download again |

## Docker

| File | What it does | Why |
|---|---|---|
| `backend/Dockerfile` | Builds the API image: Python 3.12 slim, installs the package, copies the code and migrations, then runs Uvicorn on `$PORT` | Render builds this on every push to `main`. `$PORT` lets the host choose the port. `exec` makes Uvicorn shut down cleanly when the host stops it |
| `backend/.dockerignore` | Leaves `.venv`, `.env`, `data/`, tests, and caches out of the image | Smaller image, and no secrets inside it |
| `docker-compose.yml` (repo root) | Runs PostgreSQL 16 locally on port 5432 (user and password `postgres`, database `shepherds_scholar`), keeping data in a named volume | A local database for offline work and for tests, separate from Neon. Start with `docker compose up -d` |

Docker Desktop is only needed for the local database. The API runs fine on your computer without it,
connected to Neon.

## Hosting on Render

Web service `shepherds-scholar`, free plan, Docker, root directory `backend`, Ohio region. It
redeploys on every push to `main`. Environment variables: `NEON_DATABASE_URL`, `CORS_ORIGINS` (a
JSON list that includes the Cloudflare site's address), `API_BIBLE_KEY`. The free plan sleeps after
about 15 idle minutes, so the first request after that takes 30 to 60 seconds.
