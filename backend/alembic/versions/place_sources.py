"""Where each place's data comes from: hand-written ("curated") or imported from OpenBible.info.

Revision ID: place_sources
Revises: place_candidates_passages
Create Date: 2026-11-03

OpenBible.info's Bible Geocoding Data (CC BY 4.0) covers every identifiable place in the Protestant
Bible. scripts/import_openbible_places.py loads it with data_source='openbible', source_ref set to
OpenBible's id, and source_url pointing at its page, which the map links to as the required credit.
Curated places (the map's featured places) are never overwritten by the import.
"""

from alembic import op

revision = "place_sources"
down_revision = "place_candidates_passages"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE places
            ADD COLUMN data_source VARCHAR(20) NOT NULL DEFAULT 'curated'
                CHECK (data_source IN ('curated', 'openbible')),
            ADD COLUMN source_ref VARCHAR(20),
            ADD COLUMN source_url TEXT
    """)
    op.execute("CREATE UNIQUE INDEX uq_places_source_ref ON places (data_source, source_ref) WHERE source_ref IS NOT NULL")
    op.execute("CREATE INDEX idx_places_data_source ON places (data_source)")


def downgrade() -> None:
    op.execute("DROP INDEX idx_places_data_source")
    op.execute("DROP INDEX uq_places_source_ref")
    op.execute("ALTER TABLE places DROP COLUMN source_url, DROP COLUMN source_ref, DROP COLUMN data_source")
