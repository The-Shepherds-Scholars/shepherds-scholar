"""Scripture text and caching: translations, local verses, passage cache, daily readings, API call log.

Revision ID: scripture_text_cache
Revises: core_content_schema
Create Date: 2026-10-30

Two ways Scripture text reaches a reader
---------------------------------------
* LOCAL translations (Douay-Rheims, public domain) live in local_verses.
  Serving them costs no API calls and has no licensing conditions.
* API_BIBLE translations are fetched by a background job, never by a page
  view, and stored in passage_cache together with the copyright line and the
  FUMS token. API.Bible requires cached text to be refreshed at least every
  30 days, so the job refreshes at 25 days and the app refuses rows older
  than 30 (falling back to the local translation).

Daily readings store REFERENCES and a link to the source, never the reading
text (the US lectionary text is copyrighted).
"""

from alembic import op

revision = "scripture_text_cache"
down_revision = "core_content_schema"
branch_labels = None
depends_on = None


UPGRADE = [
    """
    CREATE TABLE bible_translations (
        code             VARCHAR(12)  PRIMARY KEY,
        name             VARCHAR(160) NOT NULL,
        source           VARCHAR(12)  NOT NULL CHECK (source IN ('local', 'api_bible')),
        api_bible_id     VARCHAR(40),
        versification    VARCHAR(12)  NOT NULL
                         CHECK (versification IN ('hebrew', 'greek_latin')),
        license          TEXT         NOT NULL,
        copyright_notice TEXT,
        is_default       BOOLEAN      NOT NULL DEFAULT FALSE,
        enabled          BOOLEAN      NOT NULL DEFAULT TRUE,
        CHECK ((source = 'api_bible') = (api_bible_id IS NOT NULL)),
        CHECK (NOT is_default OR source = 'local')
    )
    """,
    # At most one default, and the default must be a local translation
    # (so the fallback path never needs the network).
    "CREATE UNIQUE INDEX uq_bible_translations_default ON bible_translations (is_default) WHERE is_default",
    """
    INSERT INTO bible_translations (code, name, source, versification, license, copyright_notice, is_default)
    VALUES ('DRC', 'Douay-Rheims Bible, Challoner Revision', 'local', 'greek_latin',
            'Public domain', NULL, TRUE)
    """,

    """
    CREATE TABLE local_verses (
        translation_code VARCHAR(12) NOT NULL REFERENCES bible_translations(code) ON DELETE CASCADE,
        book_code        VARCHAR(3)  NOT NULL REFERENCES canon_books(code),
        chapter          SMALLINT    NOT NULL CHECK (chapter >= 1),
        verse            SMALLINT    NOT NULL CHECK (verse >= 1),
        text             TEXT        NOT NULL,
        PRIMARY KEY (translation_code, book_code, chapter, verse)
    )
    """,

    """
    CREATE TABLE passage_cache (
        passage_id       UUID        NOT NULL REFERENCES scripture_passages(id) ON DELETE CASCADE,
        translation_code VARCHAR(12) NOT NULL REFERENCES bible_translations(code) ON DELETE CASCADE,
        reference_label  TEXT,
        content          TEXT        NOT NULL,
        copyright        TEXT        NOT NULL,
        fums_token       TEXT,
        fetched_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (passage_id, translation_code)
    )
    """,
    "CREATE INDEX idx_passage_cache_fetched ON passage_cache (fetched_at)",

    """
    CREATE TABLE daily_readings (
        reading_date DATE        NOT NULL,
        mass_type    VARCHAR(20) NOT NULL DEFAULT 'default',
        title        TEXT        NOT NULL,
        source_url   TEXT        NOT NULL,
        readings     JSONB       NOT NULL CHECK (jsonb_typeof(readings) = 'array'),
        provider     VARCHAR(40) NOT NULL,
        fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (reading_date, mass_type)
    )
    """,

    """
    CREATE TABLE external_api_calls (
        id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        provider    VARCHAR(40) NOT NULL,
        endpoint    TEXT        NOT NULL,
        status_code SMALLINT,
        succeeded   BOOLEAN     NOT NULL,
        called_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX idx_external_api_calls_provider_time ON external_api_calls (provider, called_at)",
    """
    CREATE VIEW external_api_usage AS
    SELECT provider,
           date_trunc('day', called_at)::date AS day,
           count(*)                           AS calls,
           count(*) FILTER (WHERE NOT succeeded) AS failures
    FROM external_api_calls
    GROUP BY provider, date_trunc('day', called_at)
    """,
]

DOWNGRADE = [
    "DROP VIEW IF EXISTS external_api_usage",
    "DROP TABLE IF EXISTS external_api_calls",
    "DROP TABLE IF EXISTS daily_readings",
    "DROP TABLE IF EXISTS passage_cache",
    "DROP TABLE IF EXISTS local_verses",
    "DROP TABLE IF EXISTS bible_translations",
]


def upgrade() -> None:
    for statement in UPGRADE:
        op.execute(statement)


def downgrade() -> None:
    for statement in DOWNGRADE:
        op.execute(statement)
