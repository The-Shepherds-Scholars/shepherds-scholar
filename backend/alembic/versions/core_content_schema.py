"""Core content schema: canon, eras, events, claims, evidence, places, people, pathways.

Revision ID: core_content_schema
Revises:
Create Date: 2026-10-30

Conventions
-----------
* Years use ASTRONOMICAL numbering internally: 1 CE = 1, 1 BCE = 0, 2 BCE = -1.
  This makes spans and sorting plain integer math. Use format_year() /
  format_year_range() (defined below) to turn them into "4 BCE" style labels.
* Scripture is stored as REFERENCES, never text, so translation licensing stays
  a display-time concern. Book codes are USFM-style (GEN, TOB, 1MA, SIR...).
* Every statement about an event is a CLAIM with a claim_type. Sources attach
  to claims, not to whole events. This is what powers the Faith / History split
  and the "how certain is this?" view.
* Enum-like columns use CHECK constraints rather than Postgres ENUM types, so
  adding a value later is a one-line migration.
* Accounts, bookmarks, and progress are intentionally NOT here. v1 keeps those
  on the device; a later migration adds users when sync is needed.
"""

from alembic import op

revision = "core_content_schema"
down_revision = None
branch_labels = None
depends_on = None


SLUG = "CHECK ({col} ~ '^[a-z0-9]+(-[a-z0-9]+)*$')"


UPGRADE = [
    # ------------------------------------------------------------------ extensions
    "CREATE EXTENSION IF NOT EXISTS pgcrypto",
    "CREATE EXTENSION IF NOT EXISTS pg_trgm",

    # ------------------------------------------------------------------ helpers
    """
    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
    LANGUAGE plpgsql AS $$
    BEGIN
        NEW.updated_at := now();
        RETURN NEW;
    END;
    $$
    """,
    # Astronomical year -> display label. 0 -> '1 BCE', -3 -> '4 BCE', 30 -> '30 CE'
    """
    CREATE OR REPLACE FUNCTION format_year(y integer) RETURNS text
    LANGUAGE sql IMMUTABLE AS $$
        SELECT CASE
            WHEN y IS NULL THEN NULL
            WHEN y <= 0 THEN (1 - y)::text || ' BCE'
            ELSE y::text || ' CE'
        END
    $$
    """,
    """
    CREATE OR REPLACE FUNCTION format_year_range(e integer, l integer) RETURNS text
    LANGUAGE sql IMMUTABLE AS $$
        SELECT CASE
            WHEN e IS NULL AND l IS NULL THEN NULL
            WHEN e IS NULL THEN 'by ' || format_year(l)
            WHEN l IS NULL THEN 'from ' || format_year(e)
            WHEN e = l THEN format_year(e)
            WHEN l <= 0 THEN (1 - e)::text || '–' || (1 - l)::text || ' BCE'
            WHEN e > 0 THEN e::text || '–' || l::text || ' CE'
            ELSE format_year(e) || ' – ' || format_year(l)
        END
    $$
    """,

    # ------------------------------------------------------------------ canon
    """
    CREATE TABLE canon_books (
        code                VARCHAR(3)  PRIMARY KEY,
        name                VARCHAR(60) NOT NULL UNIQUE,
        testament           VARCHAR(2)  NOT NULL CHECK (testament IN ('OT', 'NT')),
        canon_status        VARCHAR(20) NOT NULL DEFAULT 'protocanonical'
                            CHECK (canon_status IN ('protocanonical', 'deuterocanonical')),
        has_greek_additions BOOLEAN     NOT NULL DEFAULT FALSE,
        sort_order          SMALLINT    NOT NULL UNIQUE
    )
    """,
    """
    INSERT INTO canon_books (code, name, testament, canon_status, has_greek_additions, sort_order) VALUES
    ('GEN','Genesis','OT','protocanonical',FALSE,1),
    ('EXO','Exodus','OT','protocanonical',FALSE,2),
    ('LEV','Leviticus','OT','protocanonical',FALSE,3),
    ('NUM','Numbers','OT','protocanonical',FALSE,4),
    ('DEU','Deuteronomy','OT','protocanonical',FALSE,5),
    ('JOS','Joshua','OT','protocanonical',FALSE,6),
    ('JDG','Judges','OT','protocanonical',FALSE,7),
    ('RUT','Ruth','OT','protocanonical',FALSE,8),
    ('1SA','1 Samuel','OT','protocanonical',FALSE,9),
    ('2SA','2 Samuel','OT','protocanonical',FALSE,10),
    ('1KI','1 Kings','OT','protocanonical',FALSE,11),
    ('2KI','2 Kings','OT','protocanonical',FALSE,12),
    ('1CH','1 Chronicles','OT','protocanonical',FALSE,13),
    ('2CH','2 Chronicles','OT','protocanonical',FALSE,14),
    ('EZR','Ezra','OT','protocanonical',FALSE,15),
    ('NEH','Nehemiah','OT','protocanonical',FALSE,16),
    ('TOB','Tobit','OT','deuterocanonical',FALSE,17),
    ('JDT','Judith','OT','deuterocanonical',FALSE,18),
    ('EST','Esther','OT','protocanonical',TRUE,19),
    ('1MA','1 Maccabees','OT','deuterocanonical',FALSE,20),
    ('2MA','2 Maccabees','OT','deuterocanonical',FALSE,21),
    ('JOB','Job','OT','protocanonical',FALSE,22),
    ('PSA','Psalms','OT','protocanonical',FALSE,23),
    ('PRO','Proverbs','OT','protocanonical',FALSE,24),
    ('ECC','Ecclesiastes','OT','protocanonical',FALSE,25),
    ('SNG','Song of Songs','OT','protocanonical',FALSE,26),
    ('WIS','Wisdom','OT','deuterocanonical',FALSE,27),
    ('SIR','Sirach','OT','deuterocanonical',FALSE,28),
    ('ISA','Isaiah','OT','protocanonical',FALSE,29),
    ('JER','Jeremiah','OT','protocanonical',FALSE,30),
    ('LAM','Lamentations','OT','protocanonical',FALSE,31),
    ('BAR','Baruch','OT','deuterocanonical',FALSE,32),
    ('EZK','Ezekiel','OT','protocanonical',FALSE,33),
    ('DAN','Daniel','OT','protocanonical',TRUE,34),
    ('HOS','Hosea','OT','protocanonical',FALSE,35),
    ('JOL','Joel','OT','protocanonical',FALSE,36),
    ('AMO','Amos','OT','protocanonical',FALSE,37),
    ('OBA','Obadiah','OT','protocanonical',FALSE,38),
    ('JON','Jonah','OT','protocanonical',FALSE,39),
    ('MIC','Micah','OT','protocanonical',FALSE,40),
    ('NAM','Nahum','OT','protocanonical',FALSE,41),
    ('HAB','Habakkuk','OT','protocanonical',FALSE,42),
    ('ZEP','Zephaniah','OT','protocanonical',FALSE,43),
    ('HAG','Haggai','OT','protocanonical',FALSE,44),
    ('ZEC','Zechariah','OT','protocanonical',FALSE,45),
    ('MAL','Malachi','OT','protocanonical',FALSE,46),
    ('MAT','Matthew','NT','protocanonical',FALSE,47),
    ('MRK','Mark','NT','protocanonical',FALSE,48),
    ('LUK','Luke','NT','protocanonical',FALSE,49),
    ('JHN','John','NT','protocanonical',FALSE,50),
    ('ACT','Acts of the Apostles','NT','protocanonical',FALSE,51),
    ('ROM','Romans','NT','protocanonical',FALSE,52),
    ('1CO','1 Corinthians','NT','protocanonical',FALSE,53),
    ('2CO','2 Corinthians','NT','protocanonical',FALSE,54),
    ('GAL','Galatians','NT','protocanonical',FALSE,55),
    ('EPH','Ephesians','NT','protocanonical',FALSE,56),
    ('PHP','Philippians','NT','protocanonical',FALSE,57),
    ('COL','Colossians','NT','protocanonical',FALSE,58),
    ('1TH','1 Thessalonians','NT','protocanonical',FALSE,59),
    ('2TH','2 Thessalonians','NT','protocanonical',FALSE,60),
    ('1TI','1 Timothy','NT','protocanonical',FALSE,61),
    ('2TI','2 Timothy','NT','protocanonical',FALSE,62),
    ('TIT','Titus','NT','protocanonical',FALSE,63),
    ('PHM','Philemon','NT','protocanonical',FALSE,64),
    ('HEB','Hebrews','NT','protocanonical',FALSE,65),
    ('JAS','James','NT','protocanonical',FALSE,66),
    ('1PE','1 Peter','NT','protocanonical',FALSE,67),
    ('2PE','2 Peter','NT','protocanonical',FALSE,68),
    ('1JN','1 John','NT','protocanonical',FALSE,69),
    ('2JN','2 John','NT','protocanonical',FALSE,70),
    ('3JN','3 John','NT','protocanonical',FALSE,71),
    ('JUD','Jude','NT','protocanonical',FALSE,72),
    ('REV','Revelation','NT','protocanonical',FALSE,73)
    """,

    # ------------------------------------------------------------------ eras
    f"""
    CREATE TABLE eras (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug          VARCHAR(80)  NOT NULL UNIQUE {SLUG.format(col='slug')},
        name          VARCHAR(120) NOT NULL,
        sort_order    INTEGER      NOT NULL UNIQUE,
        earliest_year INTEGER,
        latest_year   INTEGER,
        date_label    VARCHAR(100),
        description   TEXT,
        CHECK (earliest_year IS NULL OR latest_year IS NULL OR earliest_year <= latest_year)
    )
    """,

    # ------------------------------------------------------------------ places
    f"""
    CREATE TABLE places (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug                VARCHAR(120) NOT NULL UNIQUE {SLUG.format(col='slug')},
        ancient_name        VARCHAR(200) NOT NULL,
        modern_name         VARCHAR(200),
        place_type          VARCHAR(30)  NOT NULL DEFAULT 'site'
                            CHECK (place_type IN ('city', 'region', 'mountain', 'body_of_water',
                                                  'site', 'route_point')),
        latitude            DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
        longitude           DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
        location_confidence VARCHAR(20)  NOT NULL DEFAULT 'unknown'
                            CHECK (location_confidence IN ('certain', 'probable', 'possible',
                                                           'traditional', 'unknown')),
        wikidata_id         VARCHAR(20)  CHECK (wikidata_id ~ '^Q[0-9]+$'),
        notes               TEXT,
        CHECK ((latitude IS NULL) = (longitude IS NULL))
    )
    """,

    # ------------------------------------------------------------------ people
    f"""
    CREATE TABLE people (
        id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug                       VARCHAR(120) NOT NULL UNIQUE {SLUG.format(col='slug')},
        name                       VARCHAR(200) NOT NULL,
        alternate_names            TEXT[]       NOT NULL DEFAULT '{{}}',
        description                TEXT,
        appears_in_scripture       BOOLEAN      NOT NULL DEFAULT TRUE,
        attested_outside_scripture VARCHAR(12)  NOT NULL DEFAULT 'unassessed'
                                   CHECK (attested_outside_scripture IN ('yes', 'partial', 'no',
                                                                         'unassessed')),
        earliest_year              INTEGER,
        latest_year                INTEGER,
        date_label                 VARCHAR(100),
        wikidata_id                VARCHAR(20) CHECK (wikidata_id ~ '^Q[0-9]+$'),
        CHECK (earliest_year IS NULL OR latest_year IS NULL OR earliest_year <= latest_year)
    )
    """,

    # ------------------------------------------------------------------ events
    f"""
    CREATE TABLE events (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        era_id          UUID         NOT NULL REFERENCES eras(id) ON DELETE RESTRICT,
        slug            VARCHAR(160) NOT NULL UNIQUE {SLUG.format(col='slug')},
        title           VARCHAR(200) NOT NULL,
        summary         TEXT         NOT NULL,
        earliest_year   INTEGER,
        latest_year     INTEGER,
        date_label      VARCHAR(100),
        date_confidence VARCHAR(20)  NOT NULL DEFAULT 'undetermined'
                        CHECK (date_confidence IN ('established', 'approximate', 'estimated',
                                                   'traditional', 'undetermined')),
        timeline_order  INTEGER,
        status          VARCHAR(20)  NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'in_review', 'published', 'archived')),
        search_vector   tsvector GENERATED ALWAYS AS (
                            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                            setweight(to_tsvector('english', coalesce(summary, '')), 'B')
                        ) STORED,
        created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CHECK (earliest_year IS NULL OR latest_year IS NULL OR earliest_year <= latest_year)
    )
    """,
    """
    CREATE TABLE event_places (
        event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        place_id   UUID NOT NULL REFERENCES places(id) ON DELETE RESTRICT,
        role       VARCHAR(20) NOT NULL DEFAULT 'primary'
                   CHECK (role IN ('primary', 'route', 'mentioned')),
        stop_order SMALLINT,
        PRIMARY KEY (event_id, place_id)
    )
    """,
    """
    CREATE TABLE event_people (
        event_id  UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        person_id UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        role      VARCHAR(80),
        PRIMARY KEY (event_id, person_id)
    )
    """,
    """
    CREATE TABLE event_relationships (
        from_event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        to_event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        relationship_type VARCHAR(20) NOT NULL
                          CHECK (relationship_type IN ('precedes', 'leads_to', 'fulfills',
                                                       'prefigures', 'parallels', 'commemorates')),
        description       TEXT,
        PRIMARY KEY (from_event_id, to_event_id, relationship_type),
        CHECK (from_event_id <> to_event_id)
    )
    """,

    # ------------------------------------------------------------------ sources
    """
    CREATE TABLE sources (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_type         VARCHAR(30) NOT NULL
                            CHECK (source_type IN ('ancient_text', 'inscription',
                                                   'archaeological_report', 'scholarly_work',
                                                   'church_document', 'reference_work',
                                                   'scripture')),
        title               TEXT NOT NULL,
        author              TEXT,
        original_date_label VARCHAR(100),
        publication_year    INTEGER,
        publisher           TEXT,
        url                 TEXT,
        doi                 TEXT,
        openalex_id         VARCHAR(30),
        wikidata_id         VARCHAR(20) CHECK (wikidata_id ~ '^Q[0-9]+$'),
        license             VARCHAR(120),
        citation_text       TEXT,
        notes               TEXT,
        accessed_at         TIMESTAMPTZ,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    "CREATE UNIQUE INDEX uq_sources_doi ON sources (lower(doi)) WHERE doi IS NOT NULL",

    # ------------------------------------------------------------------ claims
    """
    CREATE TABLE claims (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        claim_type VARCHAR(25) NOT NULL
                   CHECK (claim_type IN ('scripture', 'church_teaching', 'tradition',
                                         'historical_consensus', 'scholarly_hypothesis',
                                         'disputed')),
        statement  TEXT NOT NULL,
        rationale  TEXT,
        sort_order SMALLINT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE claim_sources (
        claim_id      UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
        source_id     UUID NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
        evidence_role VARCHAR(20) NOT NULL
                      CHECK (evidence_role IN ('states', 'supports', 'contextualizes',
                                               'challenges', 'discusses')),
        locator       VARCHAR(120),
        annotation    TEXT,
        PRIMARY KEY (claim_id, source_id)
    )
    """,

    # ------------------------------------------------------------------ scripture
    """
    CREATE TABLE scripture_passages (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        book_code           VARCHAR(3)  NOT NULL REFERENCES canon_books(code),
        chapter_start       SMALLINT    NOT NULL CHECK (chapter_start >= 1),
        verse_start         SMALLINT    CHECK (verse_start >= 1),
        chapter_end         SMALLINT,
        verse_end           SMALLINT    CHECK (verse_end >= 1),
        versification       VARCHAR(12) NOT NULL DEFAULT 'hebrew'
                            CHECK (versification IN ('hebrew', 'greek_latin')),
        canonical_reference VARCHAR(120) NOT NULL,
        CHECK (chapter_end IS NULL OR chapter_end >= chapter_start),
        CHECK (verse_end IS NULL OR verse_start IS NOT NULL)
    )
    """,
    """
    CREATE UNIQUE INDEX uq_scripture_passages_ref ON scripture_passages (
        book_code, chapter_start, coalesce(verse_start, 0),
        coalesce(chapter_end, 0), coalesce(verse_end, 0), versification
    )
    """,
    """
    CREATE TABLE event_passages (
        event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        passage_id        UUID NOT NULL REFERENCES scripture_passages(id) ON DELETE RESTRICT,
        relationship_type VARCHAR(20) NOT NULL DEFAULT 'narrates'
                          CHECK (relationship_type IN ('narrates', 'foretells', 'alludes_to',
                                                       'interprets', 'commemorates')),
        sort_order        SMALLINT NOT NULL DEFAULT 0,
        PRIMARY KEY (event_id, passage_id)
    )
    """,
    """
    CREATE TABLE claim_passages (
        claim_id   UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
        passage_id UUID NOT NULL REFERENCES scripture_passages(id) ON DELETE RESTRICT,
        PRIMARY KEY (claim_id, passage_id)
    )
    """,

    # ------------------------------------------------------------------ pathways
    f"""
    CREATE TABLE pathways (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug        VARCHAR(160) NOT NULL UNIQUE {SLUG.format(col='slug')},
        title       VARCHAR(200) NOT NULL,
        description TEXT,
        status      VARCHAR(20)  NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'in_review', 'published', 'archived')),
        sort_order  INTEGER
    )
    """,
    """
    CREATE TABLE pathway_steps (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pathway_id UUID     NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
        event_id   UUID     NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
        step_order SMALLINT NOT NULL CHECK (step_order >= 1),
        reflection TEXT,
        UNIQUE (pathway_id, step_order)
    )
    """,

    # ------------------------------------------------------------------ indexes
    "CREATE INDEX idx_events_era ON events (era_id)",
    "CREATE INDEX idx_events_dates ON events (earliest_year, latest_year)",
    "CREATE INDEX idx_events_status ON events (status)",
    "CREATE INDEX idx_events_search ON events USING gin (search_vector)",
    "CREATE INDEX idx_events_title_trgm ON events USING gin (title gin_trgm_ops)",
    "CREATE INDEX idx_people_name_trgm ON people USING gin (name gin_trgm_ops)",
    "CREATE INDEX idx_places_name_trgm ON places USING gin (ancient_name gin_trgm_ops)",
    "CREATE INDEX idx_claims_event ON claims (event_id, claim_type)",
    "CREATE INDEX idx_claim_sources_source ON claim_sources (source_id)",
    "CREATE INDEX idx_event_places_place ON event_places (place_id)",
    "CREATE INDEX idx_event_people_person ON event_people (person_id)",
    "CREATE INDEX idx_event_passages_passage ON event_passages (passage_id)",
    "CREATE INDEX idx_event_rel_to ON event_relationships (to_event_id)",
    "CREATE INDEX idx_pathway_steps_event ON pathway_steps (event_id)",

    # ------------------------------------------------------------------ triggers
    "CREATE TRIGGER trg_events_updated BEFORE UPDATE ON events "
    "FOR EACH ROW EXECUTE FUNCTION set_updated_at()",
    "CREATE TRIGGER trg_claims_updated BEFORE UPDATE ON claims "
    "FOR EACH ROW EXECUTE FUNCTION set_updated_at()",

    # ------------------------------------------------------------------ certainty views
    # Per-event breakdown. certainty_band describes what is in THIS dataset,
    # not a verdict on whether an event happened. Show the counts in the UI too.
    """
    CREATE VIEW event_certainty AS
    WITH claim_stats AS (
        SELECT event_id,
            count(*) FILTER (WHERE claim_type = 'scripture')            AS scripture_claims,
            count(*) FILTER (WHERE claim_type = 'church_teaching')      AS church_teaching_claims,
            count(*) FILTER (WHERE claim_type = 'tradition')            AS tradition_claims,
            count(*) FILTER (WHERE claim_type = 'historical_consensus') AS consensus_claims,
            count(*) FILTER (WHERE claim_type = 'scholarly_hypothesis') AS hypothesis_claims,
            count(*) FILTER (WHERE claim_type = 'disputed')             AS disputed_claims
        FROM claims
        GROUP BY event_id
    ),
    source_stats AS (
        SELECT c.event_id,
            count(DISTINCT cs.source_id) FILTER (
                WHERE cs.evidence_role = 'supports'
                  AND s.source_type <> 'scripture'
                  AND c.claim_type IN ('historical_consensus', 'scholarly_hypothesis')
            ) AS independent_supporting_sources,
            count(DISTINCT cs.source_id) FILTER (
                WHERE cs.evidence_role = 'challenges'
            ) AS challenging_sources
        FROM claims c
        JOIN claim_sources cs ON cs.claim_id = c.id
        JOIN sources s ON s.id = cs.source_id
        GROUP BY c.event_id
    ),
    combined AS (
        SELECT e.id AS event_id, e.slug, e.title, e.status,
            er.slug AS era_slug, er.name AS era_name, er.sort_order AS era_order,
            e.earliest_year, e.latest_year, e.timeline_order,
            coalesce(e.date_label, format_year_range(e.earliest_year, e.latest_year)) AS date_display,
            e.date_confidence,
            coalesce(cl.scripture_claims, 0)       AS scripture_claims,
            coalesce(cl.church_teaching_claims, 0) AS church_teaching_claims,
            coalesce(cl.tradition_claims, 0)       AS tradition_claims,
            coalesce(cl.consensus_claims, 0)       AS consensus_claims,
            coalesce(cl.hypothesis_claims, 0)      AS hypothesis_claims,
            coalesce(cl.disputed_claims, 0)        AS disputed_claims,
            coalesce(ss.independent_supporting_sources, 0) AS independent_supporting_sources,
            coalesce(ss.challenging_sources, 0)    AS challenging_sources
        FROM events e
        JOIN eras er ON er.id = e.era_id
        LEFT JOIN claim_stats cl ON cl.event_id = e.id
        LEFT JOIN source_stats ss ON ss.event_id = e.id
    )
    SELECT *,
        CASE
            WHEN consensus_claims > 0 AND independent_supporting_sources >= 2
                THEN 'historically_anchored'
            WHEN disputed_claims > 0 AND consensus_claims = 0
                THEN 'debated'
            WHEN consensus_claims + hypothesis_claims > 0
                THEN 'partially_attested'
            WHEN scripture_claims + church_teaching_claims + tradition_claims > 0
                THEN 'faith_and_tradition'
            ELSE 'not_yet_assessed'
        END AS certainty_band
    FROM combined
    """,
    # Per-era rollup for the timeline overview chart.
    """
    CREATE VIEW era_certainty_summary AS
    SELECT era_slug, era_name, era_order,
        count(*)                                                       AS published_events,
        count(*) FILTER (WHERE certainty_band = 'historically_anchored') AS historically_anchored,
        count(*) FILTER (WHERE certainty_band = 'partially_attested')   AS partially_attested,
        count(*) FILTER (WHERE certainty_band = 'debated')              AS debated,
        count(*) FILTER (WHERE certainty_band = 'faith_and_tradition')  AS faith_and_tradition,
        count(*) FILTER (WHERE certainty_band = 'not_yet_assessed')     AS not_yet_assessed
    FROM event_certainty
    WHERE status = 'published'
    GROUP BY era_slug, era_name, era_order
    """,
]


DOWNGRADE = [
    "DROP VIEW IF EXISTS era_certainty_summary",
    "DROP VIEW IF EXISTS event_certainty",
    "DROP TABLE IF EXISTS pathway_steps",
    "DROP TABLE IF EXISTS pathways",
    "DROP TABLE IF EXISTS claim_passages",
    "DROP TABLE IF EXISTS event_passages",
    "DROP TABLE IF EXISTS scripture_passages",
    "DROP TABLE IF EXISTS claim_sources",
    "DROP TABLE IF EXISTS claims",
    "DROP TABLE IF EXISTS sources",
    "DROP TABLE IF EXISTS event_relationships",
    "DROP TABLE IF EXISTS event_people",
    "DROP TABLE IF EXISTS event_places",
    "DROP TABLE IF EXISTS events",
    "DROP TABLE IF EXISTS people",
    "DROP TABLE IF EXISTS places",
    "DROP TABLE IF EXISTS eras",
    "DROP TABLE IF EXISTS canon_books",
    "DROP FUNCTION IF EXISTS format_year_range(integer, integer)",
    "DROP FUNCTION IF EXISTS format_year(integer)",
    "DROP FUNCTION IF EXISTS set_updated_at()",
    # Extensions are left in place; other schemas may depend on them.
]


def upgrade() -> None:
    for statement in UPGRADE:
        op.execute(statement)


def downgrade() -> None:
    for statement in DOWNGRADE:
        op.execute(statement)
