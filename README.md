# The Shepherd’s Scholar

Catholic faith and biblical history, side by side, with every statement labeled.

**Live site:** https://shepherds-scholar.gjr6906.workers.dev
**API:** https://shepherds-scholar.onrender.com ([interactive docs](https://shepherds-scholar.onrender.com/docs))

> **Work in progress.** The home page, daily readings, the Guide to Mass, Miracles, Angels and demons,
> Support a parish, Sources, and Contact pages are up, and About me has its layout but not its story yet.
> The then-and-now map has every place in the Bible (1,300+, from OpenBible.info), five with hand-written notes. The timeline, search, and guided pathways are still placeholders, and the research content
> (events, sources, miracle records) hasn't been entered yet.
> Glossary definitions and faith pages are drafts awaiting review by the Church before launch.
> The API runs on a free plan, so the first visit after a quiet spell can take up to a minute.

## What it is

A free website for believers, seekers, and the curious that sets Scripture and the historical
record next to each other. Every statement on the site is labeled by where it comes from:
Scripture, Church teaching, tradition, historical consensus, scholarly hypothesis, or disputed.
Each comes with its sources.

It includes:

- **A timeline** from the Patriarchs to the early Church, with uncertain dates shown as honest ranges
- **A then-and-now map** comparing the Roman-era Holy Land with today
- **Today’s Mass readings**, updated every morning
- **A beginner’s guide to Mass**, plus pages on miracles and on angels and demons
- **Scripture in full** from the public-domain Douay-Rheims, with the New Living Translation and
  Good News Translation from API.Bible on the way
- **Hover definitions** that explain Catholic terms in place

## Why

Most resources pick a side: devotional material that skips the history, or history that leaves out
the faith. This site aims to be faith that isn’t afraid of the details. It shows what Scripture
says, what the Church teaches, and what historians can and can’t confirm, clearly labeled, so
readers can see which is which and follow the sources themselves.

## How it works

| Part | Built with | Hosted on |
|---|---|---|
| Website | React, TypeScript, Vite | Cloudflare Workers |
| API | Python, FastAPI, in Docker | Render |
| Database | PostgreSQL | Neon |
| Daily jobs (Mass readings, Bible text cache) | Python | GitHub Actions, every morning |

The website calls the API, and the API reads the database. Outside data (Mass readings from USCCB,
translations from API.Bible) is fetched ahead of time by the daily jobs, so visitors never wait on
another service. Scripture is stored as references and looked up in a translation when shown, and
copyrighted text is cached and credited as each publisher requires.

Everything is free to run: every service above is on a free plan.

More detail, file by file, is in [docs/](docs/README.md):
[frontend](docs/frontend.md) · [backend and Docker](docs/backend.md) · [database](docs/database.md).

## Open it in VS Code

1. Install [VS Code](https://code.visualstudio.com/), [Docker Desktop](https://www.docker.com/products/docker-desktop/), Python 3.11 or newer, and Node 20 or newer.
2. Unzip the project, then in VS Code choose **File > Open Folder** and pick `shepherds-scholar`.
3. Accept the prompt to install the **recommended extensions**.
4. Open the Command Palette (Ctrl+Shift+P, or Cmd+Shift+P on a Mac), choose **Tasks: Run Task**, and run these once, in order:
   - Database: start
   - Database: create test database (once)
   - Backend: set up (first time)
   - Backend: migrate database
   - Backend: import Douay-Rheims (once)
   - Frontend: set up (first time)
5. From then on, press **Ctrl+Shift+B** (Cmd+Shift+B) to run **Dev: start everything**: the database, the API at http://localhost:8000, and the site at http://localhost:5173.

**Debugging:** open the Run and Debug panel and pick **Full stack: API + site** to set breakpoints in Python and in the browser at the same time.
**Tests:** the Testing panel (flask icon) finds the backend tests automatically, or run the task **Backend: run tests**.
**Database:** the SQLTools extension in the sidebar is already set up to browse your local database.

Where things are: `backend/` is the FastAPI API, `frontend/` is the React site, `docs/` explains every file, and the blueprint doc and wireframes describe what each screen should do.

## Run the backend

    docker compose up -d                       # PostgreSQL 16 on localhost:5432
    cd backend
    python -m venv .venv && source .venv/bin/activate
    pip install -e ".[dev]"
    cp .env.example .env                       # add API_BIBLE_KEY if you use API.Bible
    alembic upgrade head
    curl -o data/DRC.json https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/DRC.json
    python -m scripts.import_douay_rheims data/DRC.json
    python -m scripts.seed_places                          # the map's five featured places
    # every other place in the Bible, from OpenBible.info (download commands in the script):
    python -m scripts.import_openbible_places data/openbible/ancient.jsonl data/openbible/modern.jsonl
    uvicorn app.main:app --reload              # http://localhost:8000/docs

## Deploy

Pushing to `main` deploys everything:

- **Website:** Cloudflare Workers rebuilds from `frontend/`. Build variables: `VITE_API_URL`, `VITE_FORMSPREE_ID`.
- **API:** Render rebuilds the Docker image from `backend/`. Environment: `NEON_DATABASE_URL`, `CORS_ORIGINS`, `API_BIBLE_KEY`.
- **Database changes:** run `alembic upgrade head` from `backend/` against Neon. This doesn't happen automatically.

DEPLOY.md describes a Google Cloud Run setup, kept for reference; it isn't the live setup.

## Daily jobs

They run every morning in GitHub Actions (the **Daily jobs** workflow; needs the repository secrets
`NEON_DATABASE_URL` and `API_BIBLE_KEY`). To run them by hand, from `backend/`:

    python -m app.jobs.fetch_daily_readings    # Mass readings for today and the week ahead
    python -m app.jobs.refresh_passage_cache   # API.Bible text; needs API_BIBLE_KEY

## Tests

    createdb shepherds_scholar_test
    TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/shepherds_scholar_test pytest

## Hover definitions (ScholarDefinition)

Adapted from Quantum Lab's `QuantumDefinition`. Needs `npm install framer-motion lucide-react`.

    import ScholarDefinition from './components/ScholarDefinition';

    <p>Genuflect toward the <ScholarDefinition term="tabernacle" /> before entering the pew.</p>
    <p>Many <ScholarDefinition term="parish">parishes</ScholarDefinition> keep a booklet in the pews.</p>

Add or edit terms in `frontend/src/data/glossary.ts`. Set `--sdef-accent` on a page to match its saint palette.
