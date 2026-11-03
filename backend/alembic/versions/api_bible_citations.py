"""Citation wording for API.Bible translations, as API.Bible's Acceptable Use requires.

Revision ID: api_bible_citations
Revises: api_bible_nlt_gnt
Create Date: 2026-11-02

citation is the full form from API.Bible's "Citation format" rule. It is shown
on the Sources page. citation_short is the permitted short form ("[Abbreviation]
© [Year] [Organization]. All rights reserved."), shown under each passage. The
copyright line API.Bible returns with each passage is shown as well.

Years and holders follow the copyright line API.Bible returns for each Bible.
Websites are the IP holders' sites.
"""

from alembic import op
from sqlalchemy import text

revision = "api_bible_citations"
down_revision = "api_bible_nlt_gnt"
branch_labels = None
depends_on = None


def _full(abbr: str, name: str, year: str, org: str, url: str) -> str:
    return (
        f"Scripture quotations marked {abbr} are taken from the {name}, Copyright © {year} {org}. "
        f"Used by permission. All rights reserved. The {abbr} text may not be quoted in any "
        f"publication made available to the public by a Creative Commons license. The {abbr} may "
        f"not be translated into any other language. Website: {url}"
    )


CITATIONS = {
    "NLT": (
        _full("NLT", "Holy Bible, New Living Translation", "1996, 2004, 2015",
              "by Tyndale House Foundation", "https://www.tyndale.com"),
        "NLT © 1996, 2004, 2015 Tyndale House Foundation. All rights reserved.",
    ),
    "GNT": (
        _full("GNT", "Good News Translation (Today’s English Version, Second Edition)", "1992",
              "American Bible Society", "https://www.americanbible.org"),
        "GNT © 1992 American Bible Society. All rights reserved.",
    ),
}


def upgrade() -> None:
    op.execute("ALTER TABLE bible_translations ADD COLUMN citation TEXT, ADD COLUMN citation_short TEXT")
    for code, (full, short) in CITATIONS.items():
        op.get_bind().execute(
            text("UPDATE bible_translations SET citation = :full, citation_short = :short WHERE code = :code"),
            {"full": full, "short": short, "code": code},
        )
    # Every API.Bible translation must carry its citation.
    op.execute("""ALTER TABLE bible_translations ADD CONSTRAINT ck_api_bible_citation
                  CHECK (source <> 'api_bible' OR (citation IS NOT NULL AND citation_short IS NOT NULL))""")


def downgrade() -> None:
    op.execute("ALTER TABLE bible_translations DROP CONSTRAINT ck_api_bible_citation")
    op.execute("ALTER TABLE bible_translations DROP COLUMN citation, DROP COLUMN citation_short")
