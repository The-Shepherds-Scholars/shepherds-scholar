"""Daily visit and click counts, with no personal data.

Revision ID: analytics_daily
Revises: place_sources
Create Date: 2026-11-03

One row per (day, kind, path, target) with a running count, for example:
  2026-11-03 | view  | /map |            | 14
  2026-11-03 | click | /map | Emmaus     | 5
Nothing identifies a visitor: no IP address, cookie, browser details, or form input is stored.
See scripts/analytics_report.py to read the totals.
"""

from alembic import op

revision = "analytics_daily"
down_revision = "place_sources"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE analytics_daily (
            day    DATE         NOT NULL,
            kind   VARCHAR(10)  NOT NULL CHECK (kind IN ('view', 'click')),
            path   VARCHAR(200) NOT NULL,
            target VARCHAR(120) NOT NULL DEFAULT '',
            count  INTEGER      NOT NULL DEFAULT 0 CHECK (count >= 0),
            PRIMARY KEY (day, kind, path, target)
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE analytics_daily")
