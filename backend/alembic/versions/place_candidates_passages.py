"""Places for the then-and-now map: candidate sites, Scripture passages, and draft notes.

Revision ID: place_candidates_passages
Revises: api_bible_citations
Create Date: 2026-11-03

* place_candidates: when scholars disagree where a place was (Emmaus, for example), every proposed
  site is stored with its own coordinates and how likely it is, so the map can show them all.
  A place with candidates may have no single latitude/longitude of its own.
* place_passages: Scripture passages that mention the place, for "Read it in Scripture".
* places.notes_status: notes drafted with AI help stay 'draft' until checked against sources,
  and the site labels them as drafts (see the Honest notes on the Home page).
* places.featured_order: the places shown as chips on the map, in order. NULL = not featured.
* places.name: the common English name ("Capernaum"), next to ancient_name ("Capharnaum") and
  modern_name ("Kfar Nahum"). Defaults to the ancient name.

Place content is loaded by scripts/seed_places.py, not by this migration.
"""

from alembic import op

revision = "place_candidates_passages"
down_revision = "api_bible_citations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE places
            ADD COLUMN name VARCHAR(200),
            ADD COLUMN notes_status VARCHAR(10) NOT NULL DEFAULT 'draft'
                CHECK (notes_status IN ('draft', 'checked')),
            ADD COLUMN featured_order SMALLINT
    """)
    op.execute("UPDATE places SET name = ancient_name")
    op.execute("ALTER TABLE places ALTER COLUMN name SET NOT NULL")
    op.execute("""
        CREATE TABLE place_candidates (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            place_id    UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
            label       VARCHAR(200) NOT NULL,
            latitude    DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
            longitude   DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
            confidence  VARCHAR(20) NOT NULL DEFAULT 'possible'
                        CHECK (confidence IN ('certain', 'probable', 'possible', 'traditional', 'unknown')),
            note        TEXT,
            sort_order  SMALLINT NOT NULL DEFAULT 0
        )
    """)
    op.execute("CREATE INDEX idx_place_candidates_place ON place_candidates (place_id)")
    op.execute("""
        CREATE TABLE place_passages (
            place_id   UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
            passage_id UUID NOT NULL REFERENCES scripture_passages(id) ON DELETE RESTRICT,
            sort_order SMALLINT NOT NULL DEFAULT 0,
            PRIMARY KEY (place_id, passage_id)
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE place_passages")
    op.execute("DROP TABLE place_candidates")
    op.execute("ALTER TABLE places DROP COLUMN featured_order, DROP COLUMN notes_status, DROP COLUMN name")
