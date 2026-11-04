# Database

PostgreSQL, hosted on **Neon** (org Celestial, project `shepherds-scholar`, branch `main`, Ohio). For
offline work, `docker-compose.yml` runs PostgreSQL 16 on your computer instead.

Tables are created and changed only by Alembic migrations in `backend/alembic/versions/`. To change
the schema, add a new migration; don't edit tables by hand. Apply migrations with
`.venv/bin/alembic upgrade head` from `backend/`.

## Conventions

- **Years are whole numbers, astronomical style:** 1 CE = `1`, 1 BCE = `0`, 2 BCE = `-1`. That makes
  sorting and date ranges simple math. The SQL functions `format_year()` and `format_year_range()`
  turn them into labels like "4 BCE" or "30–33 CE".
- **Uncertain dates are ranges** (`earliest_year`, `latest_year`) plus a confidence level, so the
  site can show honest ranges instead of false precision.
- **Every statement is a claim with a type:** Scripture, Church teaching, tradition, historical
  consensus, scholarly hypothesis, or disputed. Sources attach to claims, not whole events. That's
  what lets the site label everything.
- **Scripture is stored as references, not text** (for example book `JHN`, chapter 3, verse 16).
  Text is looked up from a translation when shown.
- **Book codes are USFM-style**, like `GEN`, `TOB`, `1MA`, `SIR`.
- **Fixed lists use CHECK constraints**, not Postgres ENUM types, so adding a value later is a
  one-line migration.
- **No user accounts yet.** Bookmarks and progress stay on the visitor's device for now.

## Content tables (from `core_content_schema`)

These hold the site's research content. They're empty until content is entered.

| Table | Holds | Why it's designed this way |
|---|---|---|
| `canon_books` | The 73 books of the Catholic Bible: code, name, Testament, protocanonical or deuterocanonical, whether it has Greek additions, order, original language, a language note | Pre-filled. The reference list every passage checks against |
| `eras` | Big periods (for example the Patriarchs or the early Church), with date ranges and order | Groups the timeline |
| `events` | One event: title, summary, date range and confidence, era, status (`draft`, `in_review`, `published`, `archived`) | Only published events should appear on the site. Includes a built-in search index on the title and summary |
| `places` | Common, ancient, and modern names, type, coordinates, how sure the location is, Wikidata ID, a note with its draft or checked status, chip order on the map, and where the data came from (`curated` by hand, or `openbible` with its OpenBible.info id and page) | 5 curated places plus 1,337 imported from OpenBible.info | Powers the then-and-now map. Location confidence can be "traditional" when only tradition places it |
| `place_candidates` | When a place's location is disputed (Emmaus), each proposed site with coordinates, likelihood, and a note | So the map shows every candidate instead of guessing one |
| `place_passages` | Scripture passages that mention a place | "Read it in Scripture" on the map. The API.Bible job caches these passages too |
| `people` | Name, other names, whether they're attested outside Scripture, dates, Wikidata ID | Shows what history can and can't confirm |
| `event_places` | Which places an event happened at, and in what order for journeys | Links events and places, many to many |
| `event_people` | Who took part in an event, and their role | Same, for people |
| `event_relationships` | Links between events: precedes, leads to, fulfills, prefigures, parallels, commemorates | Connects the Old and New Testaments, for example a prefiguring |
| `claims` | One statement about an event, with its type (Scripture, Church teaching, …) and reasoning | The core of the faith-and-history labels |
| `sources` | Ancient texts, inscriptions, archaeology reports, scholarship, Church documents, with DOI, URL, license, citation | Each source is stored once and reused. Duplicate DOIs are blocked |
| `claim_sources` | Which sources back which claims, and how (states, supports, challenges, …), with a page or section locator | Shows which sources support a claim and which challenge it |
| `scripture_passages` | A Bible reference: book, start and end chapter and verse, numbering system, a readable label | Stored once and shared. Duplicate references are blocked |
| `event_passages` | Which passages tell of, foretell, or interpret an event | Links events to Scripture |
| `claim_passages` | Which passages a claim relies on | Links claims to Scripture |
| `pathways` | Guided journeys through events (title, description, status) | For the "guided pathway" pages |
| `pathway_steps` | The ordered events in a pathway, with an optional reflection | Ordered steps; no two steps share a number |

Search indexes are set up for event text (full-text) and for fuzzy matches on event titles, people,
and place names (`pg_trgm`), for the search page.

## Scripture text and caching (from `scripture_text_cache` and later)

| Table | Holds | Why it's designed this way |
|---|---|---|
| `bible_translations` | Each translation: code, name, `local` or `api_bible`, API.Bible ID, numbering system, license, copyright notice, full and short citation, what it was translated from, whether it includes the deuterocanonical books, default, enabled | Exactly one default, and it must be local, so the site can always show something without the network. Current rows: DRC (default), NLT, GNT |
| `local_verses` | Every verse of the Douay-Rheims (35,805 verses, 73 books) | Public domain, so it's stored in full and served at no cost |
| `passage_cache` | API.Bible text for a passage and translation, with its copyright line, FUMS token, and fetch time | Filled only by the daily job. Rows over 30 days old are never shown and are deleted, per API.Bible's terms |
| `daily_readings` | Each date's Mass title, the reading references (as JSON), the USCCB link, provider, fetch time | References only, since the lectionary text is copyrighted. One row per date and type of Mass |
| `external_api_calls` | A log of every outside API call: provider, endpoint, status, success, time | Lets the job enforce the monthly API.Bible budget |
| `external_api_usage` (view) | API call counts per provider per day | `SELECT * FROM external_api_usage ORDER BY day DESC;` to check usage |
| `analytics_daily` | Daily totals of page views and clicks: day, `view` or `click`, page path, what was clicked, count | No visitor data at all: no IP, cookie, or browser details. Read with `scripts/analytics_report.py` |
| `alembic_version` | Which migration the database is on | Managed by Alembic; don't edit |

## How a passage is served

1. The page asks the API for passage `{id}` in a translation (Douay-Rheims if none is given).
2. **Douay-Rheims:** verses come from `local_verses`. Psalm numbers are converted first if needed.
3. **API.Bible translation:** text comes from `passage_cache` if it's under 30 days old.
4. **Not cached, too old, or a book the translation doesn't have** (for example Tobit in the NLT):
   the Douay-Rheims is shown, with a note saying why.

## Neon tips

- The free plan pauses the database after a few idle minutes; the next connection wakes it in
  about a second.
- Use the **pooled** connection string (its host contains `-pooler`) for the app.
- For risky work or tests, create a branch (`neon branches create --name test`); it's a full copy
  you can wipe and delete without touching `main`.
- Never run the tests against `main`: they delete every table first.
