"""Convert Psalm references between Hebrew and Greek/Latin numbering.

Most English Bibles number the Psalms like the Hebrew text. The Douay-Rheims
follows the Greek (Septuagint) and Latin (Vulgate), which merge and split a
few psalms, so most numbers differ by one:

    Hebrew 9 + 10      = Greek/Latin 9
    Hebrew 114 + 115   = Greek/Latin 113
    Hebrew 116         = Greek/Latin 114 + 115
    Hebrew 147         = Greek/Latin 146 + 147

Verse numbers follow the Hebrew convention of counting a psalm's title as a
verse in both systems, so only chapters and the split points move.

Only the Psalms are converted here. Other known differences (Malachi has 4
chapters in the Douay-Rheims, Joel's chapter breaks, the Greek parts of
Esther and Daniel) should be entered in the translation's own numbering.
"""

from dataclasses import dataclass

HEBREW = "hebrew"
GREEK_LATIN = "greek_latin"


@dataclass(frozen=True)
class Ref:
    """A verse range. verse None at the start means verse 1; at the end, the end of that chapter."""

    book: str
    chapter_start: int
    verse_start: int | None
    chapter_end: int
    verse_end: int | None


@dataclass(frozen=True)
class _Segment:
    src_from: int
    src_to: int | None  # None = to the end of the source chapter
    dst_chapter: int
    dst_from: int


def _segments(direction: str, chapter: int) -> list[_Segment]:
    """How the verses of one source chapter land in the destination numbering."""
    if direction == "h2g":
        special = {
            10: [_Segment(1, None, 9, 22)],
            114: [_Segment(1, None, 113, 1)],
            115: [_Segment(1, None, 113, 9)],
            116: [_Segment(1, 9, 114, 1), _Segment(10, None, 115, 1)],
            147: [_Segment(1, 11, 146, 1), _Segment(12, None, 147, 1)],
        }
        if chapter in special:
            return special[chapter]
        shift = -1 if (11 <= chapter <= 113 or 117 <= chapter <= 146) else 0
        return [_Segment(1, None, chapter + shift, 1)]

    if direction == "g2h":
        special = {
            9: [_Segment(1, 21, 9, 1), _Segment(22, None, 10, 1)],
            113: [_Segment(1, 8, 114, 1), _Segment(9, None, 115, 1)],
            114: [_Segment(1, None, 116, 1)],
            115: [_Segment(1, None, 116, 10)],
            146: [_Segment(1, None, 147, 1)],
            147: [_Segment(1, None, 147, 12)],
        }
        if chapter in special:
            return special[chapter]
        shift = 1 if (10 <= chapter <= 112 or 116 <= chapter <= 145) else 0
        return [_Segment(1, None, chapter + shift, 1)]

    raise ValueError(f"unknown direction {direction!r}")


def _map_point(direction: str, chapter: int, verse: int) -> tuple[int, int]:
    for seg in _segments(direction, chapter):
        if seg.src_from <= verse and (seg.src_to is None or verse <= seg.src_to):
            return seg.dst_chapter, seg.dst_from + (verse - seg.src_from)
    raise ValueError(f"verse {verse} not covered for chapter {chapter}")


def convert(ref: Ref, source: str, target: str) -> Ref:
    """Return ref in the target numbering. Non-Psalm references pass through unchanged."""
    if source == target or ref.book != "PSA":
        return ref
    direction = "h2g" if (source, target) == (HEBREW, GREEK_LATIN) else "g2h"
    if (source, target) not in {(HEBREW, GREEK_LATIN), (GREEK_LATIN, HEBREW)}:
        raise ValueError(f"cannot convert {source} -> {target}")

    if ref.verse_start is None:
        first = _segments(direction, ref.chapter_start)[0]
        start = (first.dst_chapter, first.dst_from)
    else:
        start = _map_point(direction, ref.chapter_start, ref.verse_start)

    if ref.verse_end is None:
        last = _segments(direction, ref.chapter_end)[-1]
        end_verse = None if last.src_to is None else last.dst_from + (last.src_to - last.src_from)
        end = (last.dst_chapter, end_verse)
    else:
        end = _map_point(direction, ref.chapter_end, ref.verse_end)

    return Ref("PSA", start[0], start[1], end[0], end[1])
