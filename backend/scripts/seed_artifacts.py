"""Load the hand-picked ("curated") artifacts. Safe to re-run: artifacts are updated by slug.

    python -m scripts.seed_artifacts

Run it after scripts.seed_places and scripts.import_openbible_places, so the find sites exist. A find
site that isn't loaded yet is left empty; re-run this script once it is.

Descriptions are DRAFTS, written with AI help. They are stored with notes_status='draft', and the
site shows them as "Being checked" until someone checks each one against sources and sets
notes_status='checked'. Photos are not written here: scripts.import_wikidata_artifacts fills each
curated artifact's empty image and museum fields from Wikidata and Wikimedia Commons.

Years are astronomical: 1 BCE = 0, so 715 BCE = -714.
"""

from sqlalchemy import Connection, text

ARTIFACTS = [
    {
        "slug": "pilate-stone", "name": "Pilate Stone", "artifact_type": "inscription", "wikidata_id": "Q1073819",
        "place_slug": "caesarea", "year_discovered": 1961, "earliest_year": 26, "latest_year": 36,
        "date_label": "26–36 CE", "museum": "Israel Museum, Jerusalem", "authenticity": "accepted",
        "description": (
            "A limestone block found in the Roman theater at Caesarea. Its Latin inscription names "
            "Pontius Pilate as prefect of Judea and records a building he dedicated to the emperor Tiberius."
        ),
        "significance": "Pontius Pilate was a real Roman governor of Judea, as the Gospels say.",
        "authenticity_note": None,
    },
    {
        "slug": "caiaphas-ossuary", "name": "Caiaphas ossuary", "artifact_type": "ossuary", "wikidata_id": "Q5017513",
        "place_slug": "jerusalem", "year_discovered": 1990, "earliest_year": 1, "latest_year": 100,
        "date_label": "1st century CE", "museum": "Israel Museum, Jerusalem", "authenticity": "accepted",
        "description": (
            "A decorated limestone bone box found in a family tomb south of Jerusalem's Old City. One "
            "inscription reads \"Joseph son of Caiaphas.\""
        ),
        "significance": (
            "Likely the burial box of the high priest's family. The Gospels name Caiaphas as the high "
            "priest at Jesus' trial."
        ),
        "authenticity_note": (
            "The box is accepted as genuine. Most scholars link it to the high priest Caiaphas; a few "
            "think the name could belong to another family."
        ),
    },
    {
        "slug": "temple-warning-inscription", "name": "Temple Warning inscription", "artifact_type": "inscription",
        "wikidata_id": "Q16934222", "place_slug": "jerusalem", "year_discovered": 1871,
        "earliest_year": -22, "latest_year": 70, "date_label": "about 23 BCE – 70 CE",
        "museum": "Istanbul Archaeology Museums", "authenticity": "accepted",
        "description": (
            "A stone slab with a Greek warning that non-Jews must not pass the barrier around the Temple's "
            "inner courts, on pain of death."
        ),
        "significance": (
            "The Temple barrier that the historian Josephus describes was real. It helps explain the riot "
            "in Acts 21, when Paul was accused of bringing a Greek into the Temple."
        ),
        "authenticity_note": None,
    },
    {
        "slug": "magdala-stone", "name": "Magdala Stone", "artifact_type": "object", "wikidata_id": "Q22936482",
        "place_slug": "magdala", "year_discovered": 2009, "earliest_year": 1, "latest_year": 70,
        "date_label": "before 70 CE", "museum": None, "authenticity": "accepted",
        "description": (
            "A carved stone block found inside a synagogue at Magdala, on the Sea of Galilee. It shows a "
            "seven-branched menorah."
        ),
        "significance": (
            "Galilean towns had synagogues in Jesus' time, as the Gospels describe when he taught in "
            "them (Mark 1:39)."
        ),
        "authenticity_note": None,
    },
    {
        "slug": "capernaum-synagogue", "name": "Capernaum synagogue", "artifact_type": "building",
        "wikidata_id": "Q2916829", "place_slug": "capernaum", "year_discovered": None,
        "earliest_year": 301, "latest_year": 500, "date_label": "4th–5th century CE",
        "museum": None, "authenticity": "accepted",
        "description": (
            "The ruins of a white limestone synagogue at Capernaum. It was built centuries after Jesus, on "
            "top of older black basalt walls."
        ),
        "significance": (
            "Capernaum was a real Jewish town on the Sea of Galilee. Some excavators date the basalt walls "
            "under the synagogue to the 1st century, the time of the synagogue in Mark 1:21."
        ),
        "authenticity_note": (
            "The building is genuine. Whether the basalt walls beneath it belong to the synagogue Jesus "
            "knew is debated."
        ),
    },
    {
        "slug": "siloam-inscription", "name": "Siloam inscription", "artifact_type": "inscription",
        "wikidata_id": "Q744869", "place_slug": "siloam", "year_discovered": 1880,
        "earliest_year": -714, "latest_year": -685, "date_label": "about 700 BCE",
        "museum": "Istanbul Archaeology Museums", "authenticity": "accepted",
        "description": (
            "A Hebrew inscription carved inside the water tunnel under Jerusalem's City of David. It tells "
            "how two teams of diggers, cutting from opposite ends, met in the middle."
        ),
        "significance": (
            "The tunnel that 2 Kings 20:20 and 2 Chronicles 32:30 credit to King Hezekiah is real and can "
            "still be walked through today."
        ),
        "authenticity_note": "Most scholars date it to Hezekiah's reign; a few argue for a later date.",
    },
    {
        "slug": "james-ossuary", "name": "James ossuary", "artifact_type": "ossuary", "wikidata_id": "Q304427",
        "place_slug": None, "year_discovered": 2002, "earliest_year": 1, "latest_year": 100,
        "date_label": "1st century CE", "museum": None, "authenticity": "debated",
        "description": (
            "A limestone bone box inscribed \"James, son of Joseph, brother of Jesus.\" It came from a "
            "private collector, so where it was found is unknown."
        ),
        "significance": (
            "Not evidence. If the whole inscription is genuine, it would be the earliest mention of Jesus "
            "on an object, but that is disputed."
        ),
        "authenticity_note": (
            "The box itself is ancient. Experts disagree on whether the words \"brother of Jesus\" are "
            "original. In 2012 an Israeli court cleared its owner of forgery, but said that did not prove "
            "the inscription genuine."
        ),
    },
]


def seed(conn: Connection) -> int:
    places = dict(conn.execute(text("SELECT slug, id FROM places")).all())
    for a in ARTIFACTS:
        row = {k: v for k, v in a.items() if k != "place_slug"}
        row["place_id"] = places.get(a["place_slug"])
        row["source_url"] = f"https://www.wikidata.org/wiki/{a['wikidata_id']}" if a["wikidata_id"] else None
        # A Wikidata import of the same item is replaced by the curated row.
        conn.execute(text("DELETE FROM artifacts WHERE data_source = 'wikidata' AND wikidata_id = :wikidata_id"), row)
        conn.execute(text("""
            INSERT INTO artifacts (slug, name, artifact_type, description, significance, notes_status,
                                   authenticity, authenticity_note, year_discovered, found_at_place_id,
                                   earliest_year, latest_year, date_label, museum, data_source,
                                   source_url, wikidata_id)
            VALUES (:slug, :name, :artifact_type, :description, :significance, 'draft',
                    :authenticity, :authenticity_note, :year_discovered, :place_id,
                    :earliest_year, :latest_year, :date_label, :museum, 'curated',
                    :source_url, :wikidata_id)
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name, artifact_type = EXCLUDED.artifact_type,
                description = EXCLUDED.description, significance = EXCLUDED.significance,
                authenticity = EXCLUDED.authenticity, authenticity_note = EXCLUDED.authenticity_note,
                year_discovered = EXCLUDED.year_discovered,
                found_at_place_id = coalesce(EXCLUDED.found_at_place_id, artifacts.found_at_place_id),
                earliest_year = EXCLUDED.earliest_year, latest_year = EXCLUDED.latest_year,
                date_label = EXCLUDED.date_label, museum = coalesce(EXCLUDED.museum, artifacts.museum),
                data_source = 'curated', source_url = EXCLUDED.source_url, wikidata_id = EXCLUDED.wikidata_id
        """), row)
    return len(ARTIFACTS)


def main() -> None:
    from app.core.database import engine

    with engine.begin() as conn:
        print(f"Seeded {seed(conn)} artifacts.")


if __name__ == "__main__":
    main()
