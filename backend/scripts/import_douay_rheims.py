"""Load the Douay-Rheims (Challoner revision, public domain) into local_verses.

Download the source once (about 10 MB):

    curl -o data/DRC.json \
      https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/DRC.json

Then, from backend/:

    python -m scripts.import_douay_rheims data/DRC.json

Safe to re-run: existing verses are updated in place. Books outside the
73-book Catholic canon (the appendix's Prayer of Manasses, 3 and 4 Esdras,
and Laodiceans) are skipped. The file uses modern book names; in it
"I Samuel" and "I Kings" are what the original Douay-Rheims called 1 and 3 Kings.
"""

import json
import sys
from pathlib import Path

from sqlalchemy import Connection, text

TRANSLATION = "DRC"

# Names in the file that differ from canon_books.name
ALIASES = {
    "I Samuel": "1 Samuel", "II Samuel": "2 Samuel",
    "I Kings": "1 Kings", "II Kings": "2 Kings",
    "I Chronicles": "1 Chronicles", "II Chronicles": "2 Chronicles",
    "Song of Solomon": "Song of Songs",
    "I Maccabees": "1 Maccabees", "II Maccabees": "2 Maccabees",
    "Acts": "Acts of the Apostles",
    "I Corinthians": "1 Corinthians", "II Corinthians": "2 Corinthians",
    "I Thessalonians": "1 Thessalonians", "II Thessalonians": "2 Thessalonians",
    "I Timothy": "1 Timothy", "II Timothy": "2 Timothy",
    "I Peter": "1 Peter", "II Peter": "2 Peter",
    "I John": "1 John", "II John": "2 John", "III John": "3 John",
    "Revelation of John": "Revelation",
}
NOT_IN_CANON = {"Prayer of Manasses", "I Esdras", "II Esdras", "Additional Psalm", "Laodiceans"}

UPSERT = text("""
    INSERT INTO local_verses (translation_code, book_code, chapter, verse, text)
    VALUES (:tr, :book, :chapter, :verse, :text)
    ON CONFLICT (translation_code, book_code, chapter, verse) DO UPDATE SET text = EXCLUDED.text
""")


def load(conn: Connection, data: dict) -> dict[str, int]:
    codes = {name: code for code, name in conn.execute(text("SELECT code, name FROM canon_books"))}
    counts: dict[str, int] = {}
    unknown = []
    for book in data["books"]:
        name = book["name"]
        if name in NOT_IN_CANON:
            continue
        code = codes.get(ALIASES.get(name, name))
        if code is None:
            unknown.append(name)
            continue
        rows = [
            {"tr": TRANSLATION, "book": code, "chapter": ch["chapter"], "verse": v["verse"], "text": v["text"].strip()}
            for ch in book["chapters"] for v in ch["verses"] if v["text"].strip()
        ]
        conn.execute(UPSERT, rows)
        counts[code] = len(rows)
    if unknown:
        raise ValueError(f"Book names not mapped to the canon: {unknown}")
    missing = set(codes.values()) - set(counts)
    if missing:
        raise ValueError(f"Canon books missing from the file: {sorted(missing)}")
    return counts


def main(path: str) -> None:
    from app.core.database import engine

    data = json.loads(Path(path).read_text(encoding="utf-8"))
    with engine.begin() as conn:
        counts = load(conn, data)
    print(f"Imported {sum(counts.values())} verses across {len(counts)} books into {TRANSLATION}.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python -m scripts.import_douay_rheims path/to/DRC.json")
    main(sys.argv[1])
