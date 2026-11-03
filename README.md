
 n# The Shepherd’s Scholar

Catholic faith and biblical history, side by side, with every statement labeled.

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

Where things are: `backend/` is the FastAPI API, `frontend/` is the React site, `DEPLOY.md` is how to put it on Cloud Run, and the blueprint doc and wireframes describe what each screen should do.

## Run the backend

    docker compose up -d                       # PostgreSQL 16 on localhost:5432
    cd backend
    python -m venv .venv && source .venv/bin/activate
    pip install -e ".[dev]"
    cp .env.example .env                       # add API_BIBLE_KEY if you use API.Bible
    alembic upgrade head
    curl -o data/DRC.json https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/DRC.json
    python -m scripts.import_douay_rheims data/DRC.json
    uvicorn app.main:app --reload              # http://localhost:8000/docs

## Deploy

The API and daily jobs run on Google Cloud Run. Step-by-step commands are in DEPLOY.md.

## Daily jobs (locally, or as Cloud Run jobs in production)

    python -m app.jobs.fetch_daily_readings    # once a day, early morning
    python -m app.jobs.refresh_passage_cache   # once a day; needs API_BIBLE_KEY

## Tests

    createdb shepherds_scholar_test
    TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/shepherds_scholar_test pytest

## Hover definitions (ScholarDefinition)

Adapted from Quantum Lab's `QuantumDefinition`. Needs `npm install framer-motion lucide-react`.

    import ScholarDefinition from './components/ScholarDefinition';

    <p>Genuflect toward the <ScholarDefinition term="tabernacle" /> before entering the pew.</p>
    <p>Many <ScholarDefinition term="parish">parishes</ScholarDefinition> keep a booklet in the pews.</p>

Add or edit terms in `frontend/src/data/glossary.ts`. Set `--sdef-accent` on a page to match its saint palette.
