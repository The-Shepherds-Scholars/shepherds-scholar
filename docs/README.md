# The Shepherd’s Scholar: project overview

The Shepherd’s Scholar puts Catholic faith and biblical history side by side, and labels every
statement so a reader always knows whether it comes from Scripture, Church teaching, tradition, or
historical scholarship.

This folder explains how the project is put together:

| Doc | What it covers |
|---|---|
| [README.md](README.md) (this file) | The tech stack, the outside services, and how they connect |
| [frontend.md](frontend.md) | Every file in `frontend/`: the React site |
| [backend.md](backend.md) | Every file in `backend/`, plus Docker, the daily jobs, and tests |
| [database.md](database.md) | The PostgreSQL schema: every table, what it holds, and why |
| [api-bible-rules.md](api-bible-rules.md) | API.Bible's rules and how the project follows each one |
| [translation-citations.md](translation-citations.md) | Copyright wording for Bible translations |

For first-time setup, see the [main README](../README.md).

## How the pieces connect

```
 Visitor's browser
       │
       ▼
 Cloudflare Workers ──── serves the built React site (static files)
       │  the page calls the API with fetch()
       ▼
 Render (free web service) ──── runs the FastAPI backend in Docker
       │  SQL over TLS
       ▼
 Neon ──── PostgreSQL database (Ohio, aws-us-east-2)
       ▲
       │  writes once a day
 GitHub Actions ──── "Daily jobs" workflow: fetches Mass readings from USCCB
                     and refreshes API.Bible text
```

The site never talks to the database directly; it only calls the API. The API never calls
API.Bible or USCCB while a visitor waits. Background jobs fetch that data ahead of time and store it
in Neon, so a page view costs no outside API calls.

## Tech stack

### Frontend (`frontend/`)

| Tool | Version | What it does here | Why this one |
|---|---|---|---|
| React | 18 | Builds the pages from components | Widely used; lots of help available |
| TypeScript | 5 | JavaScript with type checking | Catches mistakes before the site is built |
| Vite | 6 | Dev server and production build | Fast reloads; simple config |
| React Router | 7 | Page addresses like `/mass` and `/miracles` | The standard router for React |
| TanStack Query | 5 | Fetches API data, caches it, tracks loading and errors | Saves writing that logic by hand on every page |
| Framer Motion | 11 | Animations in the hover definitions | Respects the visitor's reduced-motion setting |
| Leaflet | 1.9.4 | Interactive maps (Support a parish now; the then-and-now map later) | Free, small, works with OpenStreetMap and needs no key |
| Lucide React | 1 | Icons | Free, consistent icon set |
| Prettier | (editor) | Formats code on save | Keeps style consistent |

### Backend (`backend/`)

| Tool | What it does here | Why this one |
|---|---|---|
| Python 3.11+ (3.12 in Docker) | The language the API and jobs are written in | Readable; good libraries for this kind of data |
| FastAPI | The web API: routes, input checking, auto docs at `/docs` | Fast to write, documents itself |
| Uvicorn | The server that runs FastAPI | FastAPI's recommended server |
| SQLAlchemy 2 | Talks to PostgreSQL with plain SQL queries | Connection pooling without hiding the SQL |
| psycopg 3 | The PostgreSQL driver under SQLAlchemy | The current, maintained driver |
| Alembic | Database migrations (versioned schema changes) | Pairs with SQLAlchemy; every change is reviewable |
| pydantic-settings | Reads settings from environment variables and `.env` | One typed place for all configuration |
| httpx | HTTP client for API.Bible | Easy to fake in tests |
| catholic-mass-readings | Reads the daily Mass readings from USCCB | Handles USCCB's page format and its browser check |
| pytest | Tests | The standard for Python |
| Docker | Packages the API so Render can run it | Same environment everywhere |

### Database

| Tool | What it does here | Why this one |
|---|---|---|
| PostgreSQL 16+ (Neon runs 18) | Stores all content, Scripture text, and cached data | Full-text search, fuzzy name search, JSON, strong constraints |
| Neon | Hosts PostgreSQL in the cloud | Free plan, pauses when idle, easy branches for testing |
| Docker Compose (local only) | Runs PostgreSQL 16 on your own computer | Lets you work offline without touching Neon |

## Services we use

| Service | Used for | Plan | Where it's configured |
|---|---|---|---|
| **GitHub** | Code hosting; runs the daily jobs (GitHub Actions) | Free | Repo `The-Shepherds-Scholars/shepherds-scholar`; secrets under Settings > Secrets and variables > Actions |
| **Cloudflare Workers** | Hosts the website | Free | Worker `shepherds-scholar`, builds from `main`, root directory `frontend`. Build variables: `VITE_API_URL`, `VITE_FORMSPREE_ID` |
| **Render** | Hosts the API | Free (sleeps after about 15 idle minutes; the first request then takes 30 to 60 seconds) | Web service `shepherds-scholar`, Docker, root `backend`, Ohio. Env: `NEON_DATABASE_URL`, `CORS_ORIGINS`, `API_BIBLE_KEY` |
| **Neon** | PostgreSQL database | Free | Org Celestial, project `shepherds-scholar` |
| **API.Bible** | Copyrighted translations (NLT, GNT), cached by a job | Free Starter plan, strictly non-commercial | Key in `API_BIBLE_KEY`. Its rules are in [api-bible-rules.md](api-bible-rules.md) |
| **USCCB** (bible.usccb.org) | Daily Mass reading references | Public website | Read by the daily job. Only references are stored; the text is copyrighted, so the site links to USCCB |
| **OpenStreetMap + Overpass API** | Map tiles, and the church search on Support a parish | Free, no account | Must show "© OpenStreetMap contributors" (Leaflet does) and follow the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Overpass fair use is about 10,000 searches a day |
| **OpenBible.info Bible Geocoding Data** | Every place on the map, with confidence and verses | Free, CC BY 4.0 | Imported with `scripts/import_openbible_places.py`. Each imported place links to its OpenBible.info page as the credit |
| **Formspree** | The Contact form | Free | Form ID in `VITE_FORMSPREE_ID` |
| **Google Fonts** | Alegreya and Alegreya Sans | Free | Linked in `frontend/index.html` |
| **scrollmapper/bible_databases** (GitHub) | Source file for the Douay-Rheims text | Public domain | Downloaded once by the import script |
| Google Cloud Run | *Planned, not in use.* [DEPLOY.md](../DEPLOY.md) describes it, but the billing account couldn't be opened, so Render is used instead | n/a | n/a |

## Configuration in one place

Secrets live in `.env` files on your computer (never committed) and in each service's dashboard.
The `.env.example` files list every setting with no secret values.

| Setting | Where | What it is |
|---|---|---|
| `NEON_DATABASE_URL` | `backend/.env`, Render, GitHub secret | Neon connection string. When set, it is used instead of `DATABASE_URL` |
| `DATABASE_URL` | `backend/.env` | Local Docker database; used only when `NEON_DATABASE_URL` is empty |
| `API_BIBLE_KEY` | `backend/.env`, Render, GitHub secret | API.Bible key |
| `API_BIBLE_BASE_URL` | `backend/.env` | `https://rest.api.bible/v1` |
| `API_BIBLE_MONTHLY_BUDGET` | `backend/.env` | Most API.Bible calls the jobs may make per month (4500) |
| `CORS_ORIGINS` | Render | Which websites may call the API, as a JSON list |
| `VITE_API_URL` | `frontend/.env`, Cloudflare build variables | Where the site finds the API |
| `VITE_FORMSPREE_ID` | `frontend/.env`, Cloudflare build variables | Formspree form ID for the Contact page |

`VITE_` settings are written into the site when it is built, so changing one in Cloudflare needs a
new build to take effect.

## Other files at the top of the repo

| File | What it does | Why |
|---|---|---|
| `README.md` | First-time setup and everyday commands | The starting point for anyone new |
| `DEPLOY.md` | Step-by-step Google Cloud Run deployment | Kept for if Cloud Run is used later; the live setup is Render |
| `docker-compose.yml` | Starts a local PostgreSQL 16 | Develop without Neon (see [backend.md](backend.md)) |
| `.gitignore` | Keeps secrets, `node_modules`, `.venv`, builds, and the Bible download out of git | Stops passwords and large files from being committed |
| `.github/workflows/daily-readings.yml` | The "Daily jobs" workflow | See [backend.md](backend.md#daily-jobs) |
| `.vscode/tasks.json` | One-click tasks: start the database, set up, migrate, run the API and the site | Same commands for everyone, from the Command Palette |
| `.vscode/launch.json` | Debugger setups, including "Full stack: API + site" | Breakpoints in Python and the browser at once |
| `.vscode/settings.json` | Python interpreter, test discovery, formatters, SQLTools connection | The editor works as soon as the folder opens |
| `.vscode/extensions.json` | Recommended VS Code extensions | VS Code offers to install them |
