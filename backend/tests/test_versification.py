from app.services.versification import GREEK_LATIN, HEBREW, Ref, convert


def h2g(*a):
    return convert(Ref("PSA", *a), HEBREW, GREEK_LATIN)


def test_most_psalms_shift_by_one():
    assert h2g(23, 1, 23, 6) == Ref("PSA", 22, 1, 22, 6)
    assert h2g(51, 3, 51, 4) == Ref("PSA", 50, 3, 50, 4)


def test_unshifted_ranges():
    assert h2g(1, 1, 1, 6) == Ref("PSA", 1, 1, 1, 6)
    assert h2g(150, 1, 150, 6) == Ref("PSA", 150, 1, 150, 6)


def test_merged_and_split_psalms():
    assert h2g(10, 1, 10, 1) == Ref("PSA", 9, 22, 9, 22)
    assert h2g(115, 1, 115, 1) == Ref("PSA", 113, 9, 113, 9)
    assert h2g(116, 10, 116, 10) == Ref("PSA", 115, 1, 115, 1)
    assert h2g(147, 12, 147, 12) == Ref("PSA", 147, 1, 147, 1)


def test_whole_chapters():
    assert h2g(10, None, 10, None) == Ref("PSA", 9, 22, 9, None)
    assert h2g(116, None, 116, None) == Ref("PSA", 114, 1, 115, None)
    assert h2g(9, None, 9, None) == Ref("PSA", 9, 1, 9, None)


def test_round_trip_points():
    for ch, v in [(10, 5), (114, 3), (115, 7), (116, 2), (116, 15), (147, 4), (147, 15), (40, 2)]:
        g = h2g(ch, v, ch, v)
        back = convert(g, GREEK_LATIN, HEBREW)
        assert (back.chapter_start, back.verse_start) == (ch, v)


def test_other_books_untouched():
    r = Ref("JHN", 3, 16, 3, 16)
    assert convert(r, HEBREW, GREEK_LATIN) == r
