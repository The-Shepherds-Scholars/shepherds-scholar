"""Add the New Living Translation and the Good News Translation from API.Bible.

Revision ID: api_bible_nlt_gnt
Revises: book_language_info
Create Date: 2026-11-02

Both come from API.Bible and are cached by the refresh_passage_cache job.
Neither includes the deuterocanonical books (Tobit, Judith, Wisdom, Sirach,
Baruch, 1 and 2 Maccabees), so includes_deuterocanon is FALSE for them: the
job does not request those books, and the app shows the Douay-Rheims instead
with a notice saying why.

copyright_notice is the wording API.Bible returns for each Bible. The app
shows the copyright line API.Bible sends with every cached passage, as its
terms require. User-supplied wording is kept in docs/translation-citations.md.
"""

from alembic import op
from sqlalchemy import text

revision = "api_bible_nlt_gnt"
down_revision = "book_language_info"
branch_labels = None
depends_on = None

TRANSLATIONS = [
    {
        "code": "NLT",
        "name": "New Living Translation",
        "api_bible_id": "d6e14a625393b4da-01",
        "license": "Copyrighted; used through API.Bible",
        "copyright_notice": (
            "Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by Tyndale House "
            "Foundation. Used by permission of Tyndale House Publishers, Carol Stream, Illinois "
            "60188. All rights reserved."
        ),
        "translated_from": "the original Hebrew, Aramaic, and Greek",
    },
    {
        "code": "GNT",
        "name": "Good News Translation",
        "api_bible_id": "61fd76eafa1577c2-02",
        "license": "Copyrighted; used through API.Bible",
        "copyright_notice": (
            "Good News Translation® (Today’s English Version, Second Edition) © 1992 American "
            "Bible Society. All rights reserved."
        ),
        "translated_from": "the original Hebrew, Aramaic, and Greek",
    },
]


def upgrade() -> None:
    op.execute("ALTER TABLE bible_translations "
               "ADD COLUMN includes_deuterocanon BOOLEAN NOT NULL DEFAULT TRUE")
    insert = text("""
        INSERT INTO bible_translations (code, name, source, api_bible_id, versification, license,
                                        copyright_notice, translated_from, includes_deuterocanon)
        VALUES (:code, :name, 'api_bible', :api_bible_id, 'hebrew', :license,
                :copyright_notice, :translated_from, FALSE)
    """)
    for t in TRANSLATIONS:
        op.get_bind().execute(insert, t)


def downgrade() -> None:
    op.execute("DELETE FROM passage_cache WHERE translation_code IN ('NLT', 'GNT')")
    op.execute("DELETE FROM bible_translations WHERE code IN ('NLT', 'GNT')")
    op.execute("ALTER TABLE bible_translations DROP COLUMN includes_deuterocanon")
