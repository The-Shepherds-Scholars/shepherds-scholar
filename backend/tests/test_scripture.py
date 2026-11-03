from datetime import datetime, timedelta, timezone

from sqlalchemy import text

from app.services import scripture
from tests.conftest import add_passage, add_verses


def test_local_passage(conn):
    add_verses(conn, "JHN", 3, [(16, "For God so loved the world"), (17, "For God sent not his Son")])
    pid = add_passage(conn, "JHN", 3, 16, label="John 3:16")
    p = scripture.get_passage(conn, pid)
    assert p.translation_code == "DRC"
    assert [v.text for v in p.verses] == ["For God so loved the world"]
    assert p.fums_token is None and not p.fell_back


def test_psalm_converted_for_douay(conn):
    add_verses(conn, "PSA", 22, [(1, "A psalm for David. The Lord ruleth me"), (2, "He hath set me")])
    pid = add_passage(conn, "PSA", 23, 1, None, 2, label="Psalm 23:1-2")
    p = scripture.get_passage(conn, pid)
    assert [(v.chapter, v.verse) for v in p.verses] == [(22, 1), (22, 2)]


def test_whole_split_psalm(conn):
    add_verses(conn, "PSA", 9, [(21, "end of nine"), (22, "Why, O Lord"), (23, "next")])
    add_verses(conn, "PSA", 10, [(1, "In the Lord I put my trust")])
    pid = add_passage(conn, "PSA", 10, label="Psalm 10")
    p = scripture.get_passage(conn, pid)
    assert [(v.chapter, v.verse) for v in p.verses] == [(9, 22), (9, 23)]


def _add_api_translation(conn):
    conn.execute(text("""INSERT INTO bible_translations (code, name, source, api_bible_id, versification, license)
                         VALUES ('RSVCE', 'Test API Bible', 'api_bible', 'abc-01', 'hebrew', 'Licensed via API.Bible')"""))


def test_api_translation_without_cache_falls_back(conn):
    _add_api_translation(conn)
    add_verses(conn, "JHN", 3, [(16, "For God so loved the world")])
    pid = add_passage(conn, "JHN", 3, 16, label="John 3:16")
    p = scripture.get_passage(conn, pid, "RSVCE")
    assert p.fell_back and p.translation_code == "DRC"
    assert "Test API Bible" in p.notice


def test_fresh_cache_served_with_fums_token(conn):
    _add_api_translation(conn)
    pid = add_passage(conn, "JHN", 3, 16, label="John 3:16")
    conn.execute(text("""INSERT INTO passage_cache (passage_id, translation_code, content, copyright, fums_token, fetched_at)
                         VALUES (:p, 'RSVCE', 'cached text', '(c) Publisher', 'tok-1', :t)"""),
                 {"p": pid, "t": datetime.now(timezone.utc) - timedelta(days=10)})
    p = scripture.get_passage(conn, pid, "RSVCE")
    assert (p.content, p.copyright, p.fums_token, p.fell_back) == ("cached text", "(c) Publisher", "tok-1", False)


def test_cache_older_than_30_days_is_not_served(conn):
    _add_api_translation(conn)
    add_verses(conn, "JHN", 3, [(16, "For God so loved the world")])
    pid = add_passage(conn, "JHN", 3, 16, label="John 3:16")
    conn.execute(text("""INSERT INTO passage_cache (passage_id, translation_code, content, copyright, fetched_at)
                         VALUES (:p, 'RSVCE', 'old text', '(c)', :t)"""),
                 {"p": pid, "t": datetime.now(timezone.utc) - timedelta(days=31)})
    p = scripture.get_passage(conn, pid, "RSVCE")
    assert p.fell_back and p.verses[0].text.startswith("For God")


def test_reference_is_built_from_the_book(conn):
    add_verses(conn, "ROM", 8, [(31, "What shall we then say"), (32, "He that spared not")])
    pid = add_passage(conn, "ROM", 8, 31, None, 32, label="typo-prone hand label")
    p = scripture.get_passage(conn, pid)
    assert p.reference == "Romans 8:31–32"
    assert (p.book.name, p.book.testament, p.book.original_language) == ("Romans", "NT", "Greek")
    assert p.translated_from == "the Latin Vulgate"
    assert p.translation_reference is None


def test_psalm_shows_both_numberings(conn):
    add_verses(conn, "PSA", 22, [(1, "A psalm for David. The Lord ruleth me"), (2, "He hath set me")])
    pid = add_passage(conn, "PSA", 23, 1, None, 2)
    p = scripture.get_passage(conn, pid)
    assert p.reference == "Psalm 23:1–2" and p.translation_reference == "Psalm 22:1–2"
    assert p.book.original_language == "Hebrew"


def test_deuterocanonical_book_info(conn):
    add_verses(conn, "TOB", 1, [(1, "Tobias of the tribe and city of Nephthali")])
    pid = add_passage(conn, "TOB", 1, 1)
    p = scripture.get_passage(conn, pid)
    assert p.book.canon_status == "deuterocanonical"
    assert "Qumran" in p.book.language_note


def test_every_book_has_a_language(conn):
    from sqlalchemy import text as t
    assert conn.execute(t("SELECT count(*) FROM canon_books WHERE original_language IS NULL")).scalar_one() == 0


def test_format_reference_shapes():
    from app.services.versification import Ref
    f = scripture.format_reference
    assert f("Genesis", Ref("GEN", 12, None, 12, None)) == "Genesis 12"
    assert f("Psalms", Ref("PSA", 22, 1, 22, None)) == "Psalm 22"
    assert f("Psalms", Ref("PSA", 114, 1, 115, None)) == "Psalms 114–115"
    assert f("Mark", Ref("MRK", 15, 42, 16, 8)) == "Mark 15:42–16:8"
    assert f("John", Ref("JHN", 3, 16, 3, 16)) == "John 3:16"


def test_deuterocanonical_book_missing_from_translation_explains_why(conn):
    conn.execute(text("""INSERT INTO bible_translations (code, name, source, api_bible_id, versification, license,
                                                         includes_deuterocanon)
                         VALUES ('PROT', 'Test 66-book Bible', 'api_bible', 'p-01', 'hebrew', 'Licensed', FALSE)"""))
    add_verses(conn, "TOB", 12, [(15, "I am the angel Raphael")])
    pid = add_passage(conn, "TOB", 12, 15, label="Tobit 12:15")
    p = scripture.get_passage(conn, pid, "PROT")
    assert p.fell_back and p.translation_code == "DRC"
    assert "doesn’t include Tobit" in p.notice
