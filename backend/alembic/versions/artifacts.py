"""Artifacts: archaeological finds, where they were found, and which claims they bear on.

Revision ID: artifacts
Revises: analytics_daily
Create Date: 2026-11-18

An artifact shows that the world of the Bible was real: its people, places, and customs. It never
proves a matter of faith, so each artifact says what it shows (`significance`) and how sure scholars
are that it is genuine (`authenticity`):

  accepted    scholars accept the object as genuine
  debated     its genuineness, or the part that matters (an inscription), is disputed
  forgery     shown to be fake; kept so the site can say so
  unreviewed  imported and not yet checked by a person; the site shows "Being checked"

claim_artifacts links artifacts to claims with the same evidence roles as claim_sources. A trigger
makes sure only an 'accepted' artifact can 'state' or 'support' a claim, so a contested object can
never be shown as evidence for a claim. A debated one can still 'contextualize', 'challenge', or be
'discussed'.

Rows come from two places, like places:
  * data_source='curated': written by hand in scripts/seed_artifacts.py.
  * data_source='wikidata': scripts/import_wikidata_artifacts.py, matched by Wikidata id
    (source_ref). The import never overwrites a curated row; it only fills a curated row's empty
    image and museum fields.

Years are astronomical (1 BCE = 0), like events. An image is stored only with its license and
credit, and the site links to the image's own page, so every photo is credited.
"""

from alembic import op

revision = "artifacts"
down_revision = "analytics_daily"
branch_labels = None
depends_on = None

EVIDENCE_ROLES = "('states', 'supports', 'contextualizes', 'challenges', 'discusses')"


def upgrade() -> None:
    op.execute(r"""
        CREATE TABLE artifacts (
            id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug               VARCHAR(160) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
            name               VARCHAR(200) NOT NULL,
            artifact_type      VARCHAR(20)  NOT NULL DEFAULT 'object'
                               CHECK (artifact_type IN ('inscription', 'coin', 'ossuary', 'building',
                                                        'manuscript', 'object')),
            description        TEXT,
            significance       TEXT,
            notes_status       VARCHAR(10)  NOT NULL DEFAULT 'draft' CHECK (notes_status IN ('draft', 'checked')),
            authenticity       VARCHAR(12)  NOT NULL DEFAULT 'unreviewed'
                               CHECK (authenticity IN ('accepted', 'debated', 'forgery', 'unreviewed')),
            authenticity_note  TEXT,
            year_discovered    SMALLINT,
            found_at_place_id  UUID REFERENCES places(id) ON DELETE SET NULL,
            find_latitude      DOUBLE PRECISION CHECK (find_latitude BETWEEN -90 AND 90),
            find_longitude     DOUBLE PRECISION CHECK (find_longitude BETWEEN -180 AND 180),
            earliest_year      INTEGER,
            latest_year        INTEGER,
            date_label         VARCHAR(100),
            museum             VARCHAR(200),
            museum_url         TEXT,
            image_url          TEXT,
            image_license      VARCHAR(120),
            image_credit       TEXT,
            image_source_url   TEXT,
            data_source        VARCHAR(20)  NOT NULL DEFAULT 'curated'
                               CHECK (data_source IN ('curated', 'wikidata')),
            source_ref         VARCHAR(20),
            source_url         TEXT,
            wikidata_id        VARCHAR(20)  CHECK (wikidata_id ~ '^Q[0-9]+$'),
            created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
            updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
            CHECK ((find_latitude IS NULL) = (find_longitude IS NULL)),
            CHECK (earliest_year IS NULL OR latest_year IS NULL OR earliest_year <= latest_year),
            -- Never show a photo without its license and credit.
            CHECK (image_url IS NULL OR (image_license IS NOT NULL AND image_source_url IS NOT NULL))
        )
    """)
    op.execute("CREATE UNIQUE INDEX uq_artifacts_source_ref ON artifacts (data_source, source_ref) WHERE source_ref IS NOT NULL")
    # One row per Wikidata item, so a curated artifact and an import can never both exist.
    op.execute("CREATE UNIQUE INDEX uq_artifacts_wikidata ON artifacts (wikidata_id) WHERE wikidata_id IS NOT NULL")
    op.execute("CREATE INDEX idx_artifacts_place ON artifacts (found_at_place_id)")
    op.execute("CREATE INDEX idx_artifacts_name_trgm ON artifacts USING gin (name gin_trgm_ops)")
    op.execute("CREATE TRIGGER trg_artifacts_updated BEFORE UPDATE ON artifacts "
               "FOR EACH ROW EXECUTE FUNCTION set_updated_at()")

    op.execute(f"""
        CREATE TABLE claim_artifacts (
            claim_id      UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
            artifact_id   UUID NOT NULL REFERENCES artifacts(id) ON DELETE RESTRICT,
            evidence_role VARCHAR(20) NOT NULL CHECK (evidence_role IN {EVIDENCE_ROLES}),
            annotation    TEXT,
            PRIMARY KEY (claim_id, artifact_id)
        )
    """)
    op.execute("CREATE INDEX idx_claim_artifacts_artifact ON claim_artifacts (artifact_id)")

    # Only an accepted artifact may state or support a claim. Checked from both sides: adding the
    # link, and changing an artifact's authenticity after it is linked.
    op.execute("""
        CREATE FUNCTION check_artifact_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            IF TG_TABLE_NAME = 'claim_artifacts' THEN
                IF NEW.evidence_role IN ('states', 'supports') AND EXISTS (
                    SELECT 1 FROM artifacts WHERE id = NEW.artifact_id AND authenticity <> 'accepted'
                ) THEN
                    RAISE EXCEPTION 'Only an accepted artifact can % a claim', NEW.evidence_role;
                END IF;
            ELSIF NEW.authenticity <> 'accepted' AND EXISTS (
                SELECT 1 FROM claim_artifacts
                WHERE artifact_id = NEW.id AND evidence_role IN ('states', 'supports')
            ) THEN
                RAISE EXCEPTION 'Artifact % supports a claim; change those links before marking it %',
                    NEW.slug, NEW.authenticity;
            END IF;
            RETURN NEW;
        END;
        $$
    """)
    op.execute("CREATE TRIGGER trg_claim_artifacts_evidence BEFORE INSERT OR UPDATE ON claim_artifacts "
               "FOR EACH ROW EXECUTE FUNCTION check_artifact_evidence()")
    op.execute("CREATE TRIGGER trg_artifacts_evidence BEFORE UPDATE OF authenticity ON artifacts "
               "FOR EACH ROW EXECUTE FUNCTION check_artifact_evidence()")


def downgrade() -> None:
    op.execute("DROP TABLE claim_artifacts")
    op.execute("DROP TABLE artifacts")
    op.execute("DROP FUNCTION check_artifact_evidence()")
