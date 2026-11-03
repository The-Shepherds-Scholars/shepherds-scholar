"""Book and translation origins: the language each book was written in, and what each translation was made from.

Revision ID: book_language_info
Revises: scripture_text_cache
Create Date: 2026-10-30

Every passage the app shows now says which book it is from, which Testament,
whether the book is deuterocanonical, the language the book was written in,
and what the translation was made from (the Douay-Rheims is an English
translation of the Latin Vulgate, not of the Hebrew and Greek directly).

The language notes summarize mainstream scholarship; have them reviewed
along with the rest of the content before launch.
"""

from alembic import op

revision = "book_language_info"
down_revision = "scripture_text_cache"
branch_labels = None
depends_on = None

HEBREW_BOOKS = ("GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI",
                "1CH", "2CH", "NEH", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK",
                "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL")

SPECIAL = {
    "EZR": ("Hebrew and Aramaic", "Parts of chapters 4 to 7 are in Aramaic."),
    "DAN": ("Hebrew and Aramaic", "Chapters 2 to 7 are in Aramaic. The Greek additions (3:24–90, chapters 13–14) survive in Greek."),
    "EST": ("Hebrew", "The additional passages in Catholic Bibles survive in Greek."),
    "TOB": ("Aramaic or Hebrew", "Survives mainly in Greek; Aramaic and Hebrew fragments were found at Qumran."),
    "JDT": ("Greek", "Survives in Greek; many scholars think it was first written in Hebrew."),
    "1MA": ("Greek", "Survives in Greek; it was most likely first written in Hebrew."),
    "2MA": ("Greek", None),
    "WIS": ("Greek", None),
    "SIR": ("Hebrew", "Survives complete in Greek; much of the Hebrew has been recovered."),
    "BAR": ("Greek", "Survives in Greek; parts may first have been written in Hebrew."),
}


def _q(s: str | None) -> str:
    return "NULL" if s is None else "'" + s.replace("'", "''") + "'"


def upgrade() -> None:
    op.execute("ALTER TABLE canon_books ADD COLUMN original_language VARCHAR(60), ADD COLUMN language_note TEXT")
    op.execute("UPDATE canon_books SET original_language = 'Greek' WHERE testament = 'NT'")
    op.execute("UPDATE canon_books SET original_language = 'Hebrew' WHERE code IN ("
               + ", ".join(f"'{c}'" for c in HEBREW_BOOKS) + ")")
    for code, (lang, note) in SPECIAL.items():
        op.execute(f"UPDATE canon_books SET original_language = {_q(lang)}, language_note = {_q(note)} "
                   f"WHERE code = '{code}'")
    op.execute("ALTER TABLE canon_books ALTER COLUMN original_language SET NOT NULL")

    op.execute("ALTER TABLE bible_translations ADD COLUMN translated_from VARCHAR(120)")
    op.execute("UPDATE bible_translations SET translated_from = 'the Latin Vulgate' WHERE code = 'DRC'")


def downgrade() -> None:
    op.execute("ALTER TABLE bible_translations DROP COLUMN IF EXISTS translated_from")
    op.execute("ALTER TABLE canon_books DROP COLUMN IF EXISTS language_note, DROP COLUMN IF EXISTS original_language")
