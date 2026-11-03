import { useEffect, useState } from "react";
import { useFums } from "./useFums";

type Verse = { chapter: number; verse: number; text: string };
type Book = {
  code: string;
  name: string;
  testament: "OT" | "NT";
  canon_status: "protocanonical" | "deuterocanonical";
  original_language: string;
  language_note: string | null;
};
type Passage = {
  reference: string;              // always includes the book, e.g. "Romans 8:31–39"
  book: Book;
  translation_reference: string | null; // e.g. "Psalm 22:1–2" when the Douay-Rheims numbers it differently
  translated_from: string | null; // e.g. "the Latin Vulgate"
  translation_code: string;
  translation_name: string;
  verses: Verse[] | null;   // local translations (Douay-Rheims)
  content: string | null;   // cached API.Bible text
  copyright: string | null;
  fums_token: string | null;
  fell_back: boolean;
  notice: string | null;
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function PassageText({ passageId, translation }: { passageId: string; translation?: string }) {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = translation ? `?translation=${encodeURIComponent(translation)}` : "";
    fetch(`${API}/api/v1/passages/${passageId}${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setPassage)
      .catch(() => setError("This passage couldn’t be loaded. Check your connection and try again."));
  }, [passageId, translation]);

  useFums(passage?.fums_token);

  if (error) return <p role="alert">{error}</p>;
  if (!passage) return <p aria-busy="true">Loading passage…</p>;

  return (
    <figure className="passage">
      <figcaption>
        <strong>{passage.reference}</strong>
        {passage.translation_reference && (
          <span className="alt-ref"> (numbered {passage.translation_reference} in this translation)</span>
        )}
      </figcaption>
      <p className="book-origin">{describeBook(passage.book)}</p>
      {passage.notice && <p className="passage-notice">{passage.notice}</p>}
      {passage.verses ? (
        <blockquote>
          {passage.verses.map((v) => (
            <span key={`${v.chapter}:${v.verse}`}>
              <sup>{v.verse}</sup> {v.text}{" "}
            </span>
          ))}
        </blockquote>
      ) : (
        // Plain text from API.Bible (content-type=text); rendered as text, never as HTML.
        <blockquote style={{ whiteSpace: "pre-line" }}>{passage.content}</blockquote>
      )}
      <p className="translation-origin">
        {passage.translation_name}
        {passage.translated_from ? `, translated from ${passage.translated_from}` : ""}
      </p>
      {/* API.Bible requires the copyright line beside every passage it supplies. */}
      {passage.copyright && <small className="copyright">{passage.copyright}</small>}
    </figure>
  );
}

/**
 * "Romans is in the New Testament. Written in Greek."
 * "Tobit is a deuterocanonical book of the Old Testament, found in Catholic Bibles.
 *  Written in Aramaic or Hebrew. Survives mainly in Greek; ..."
 */
function describeBook(book: Book): string {
  const testament = book.testament === "NT" ? "New Testament" : "Old Testament";
  const where = book.canon_status === "deuterocanonical"
    ? `${book.name} is a deuterocanonical book of the ${testament}, found in Catholic Bibles.`
    : `${book.name} is in the ${testament}.`;
  const note = book.language_note ? ` ${book.language_note}` : "";
  return `${where} Written in ${book.original_language}.${note}`;
}
