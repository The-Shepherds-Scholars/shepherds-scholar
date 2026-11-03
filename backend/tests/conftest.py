import os

os.environ.setdefault("DATABASE_URL", os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/shepherds_scholar_test"))
os.environ.setdefault("API_BIBLE_KEY", "test-key")
# Never let tests reach Neon: they drop the whole schema of the database they use.
os.environ["NEON_DATABASE_URL"] = ""

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

URL = os.environ["DATABASE_URL"]


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(URL)
    with eng.begin() as c:
        c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
    cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "..", "alembic"))
    cfg.set_main_option("sqlalchemy.url", URL)
    command.upgrade(cfg, "head")
    return eng


@pytest.fixture
def conn(engine):
    """Each test runs in a transaction that is rolled back afterwards."""
    with engine.connect() as c:
        tx = c.begin()
        yield c
        tx.rollback()


def add_passage(conn, book, c1, v1=None, c2=None, v2=None, versification="hebrew", label="ref"):
    return conn.execute(text("""
        INSERT INTO scripture_passages (book_code, chapter_start, verse_start, chapter_end, verse_end,
                                        versification, canonical_reference)
        VALUES (:b, :c1, :v1, :c2, :v2, :vs, :label) RETURNING id"""),
        {"b": book, "c1": c1, "v1": v1, "c2": c2, "v2": v2, "vs": versification, "label": label}).scalar_one()


def add_verses(conn, book, chapter, verses, tr="DRC"):
    conn.execute(text("""INSERT INTO local_verses (translation_code, book_code, chapter, verse, text)
                         VALUES (:tr, :b, :c, :v, :t)"""),
                 [{"tr": tr, "b": book, "c": chapter, "v": v, "t": t} for v, t in verses])
