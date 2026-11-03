import json
import os

import pytest
from sqlalchemy import text

from scripts.import_douay_rheims import load

DRC = os.environ.get("DRC_JSON", "data/DRC.json")


@pytest.mark.skipif(not os.path.exists(DRC), reason="download DRC.json to run (see the script's docstring)")
def test_full_import(conn):
    counts = load(conn, json.load(open(DRC, encoding="utf-8")))
    assert len(counts) == 73
    psalm = conn.execute(text("""SELECT text FROM local_verses
                                 WHERE translation_code='DRC' AND book_code='PSA' AND chapter=22 AND verse=1""")).scalar_one()
    assert "The Lord ruleth me" in psalm
