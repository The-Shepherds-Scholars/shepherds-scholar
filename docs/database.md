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

## Artifacts (from `artifacts`)

An artifact shows that the world of the Bible was real: its people, places, and customs. No object
proves a matter of faith, and the tables are built so the site can't present one that way.

| Table | Holds | Why it's designed this way |
|---|---|---|
| `artifacts` | Name, type (`inscription`, `coin`, `ossuary`, `building`, `manuscript`, `object`), a description, what it shows (`significance`), draft or checked status, authenticity and a note on it, year discovered, find site (`found_at_place_id`) and find coordinates, date range in astronomical years with a label, museum and its link, photo with license, credit, and Commons page, and where the row came from (`curated`, or `wikidata` with the Wikidata id) | 7 curated artifacts to start. Wikidata imports are added weekly. Mirrors `places`: the import never overwrites a curated row, and one Wikidata item can only be in the table once |
| `claim_artifacts` | Which artifacts bear on which claims, using the same roles as `claim_sources` (states, supports, contextualizes, challenges, discusses), with a note | Shows which finds support a claim and which only give context |

**Authenticity** is one of:

| Value | Meaning | On the site |
|---|---|---|
| `accepted` | Scholars accept the object as genuine | Shown normally |
| `debated` | Its genuineness, or the part that matters (such as an inscription), is disputed. The James ossuary is the example | Labeled as debated; never shown as proof |
| `forgery` | Shown to be fake | Kept so the site can say so |
| `unreviewed` | Imported from Wikidata and not yet checked by a person | "Being checked" |

Rules the database enforces:

- Only an `accepted` artifact can `state` or `support` a claim. A trigger blocks such a link to any
  other artifact, and also blocks changing a linked artifact away from `accepted` until its links
  are changed.
- A photo can't be stored without its license and the link to its Commons page.
- If a find spot has coordinates, both latitude and longitude are set. When it has none, the site
  uses the find site's location.

To mark an artifact checked after reviewing it against sources:

```sql
UPDATE artifacts SET notes_status = 'checked', authenticity = 'accepted' WHERE slug = 'pilate-stone';
```

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
- Use the **pooled** connection string (its host contains `-pooler`) for the app, in Render's
  `NEON_DATABASE_URL`. Neon's pooler handles many more connections than the database itself, so a
  busy moment doesn't run out of connections.
- The map's places and artifacts are read from static files on Cloudflare, not from Neon, so visits
  to the map don't use Neon's free compute hours. Only the weekly export reads them from Neon.
- For risky work or tests, create a branch (`neon branches create --name test`); it's a full copy
  you can wipe and delete without touching `main`.
- Never run the tests against `main`: they delete every table first.
