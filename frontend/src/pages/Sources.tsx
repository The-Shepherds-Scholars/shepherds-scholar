import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ScholarDefinition from '../components/ScholarDefinition';
import Skeleton from '../components/Skeleton';
import { apiGet } from '../lib/api';

// Sources and APIs, styled after the design concept (page 13) and wireframe 11.
// Static list in v1 (later GET /api/v1/sources?type=dataset). Rows marked `planned` are in the concept
// but not used by the site yet; they say so until the map and timeline use them.
// The Bible translations section carries the full citation API.Bible's Acceptable Use requires.
interface Translation {
  code: string;
  name: string;
  source: 'local' | 'api_bible';
  license: string;
  translated_from: string | null;
  copyright_notice: string | null;
  citation: string | null;
}

const SOURCES: Array<{ name: string; url: string; provides: ReactNode; license: string; planned?: boolean }> = [
  { name: 'Douay-Rheims Bible, Challoner revision', url: 'https://github.com/scrollmapper/bible_databases', provides: <>The Scripture text, all 73 books, including the <ScholarDefinition term="deuterocanonical">deuterocanonical</ScholarDefinition> ones</>, license: 'Public domain' },
  { name: 'USCCB daily readings', url: 'https://bible.usccb.org/daily-bible-reading', provides: <>The day’s <ScholarDefinition term="mass">Mass</ScholarDefinition> readings from the <ScholarDefinition term="lectionary">lectionary</ScholarDefinition>, linked rather than copied</>, license: 'Copyright USCCB; linked only' },
  { name: 'The Roman Missal, English translation (ICEL)', url: 'https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass', provides: 'The short prayers and responses quoted in the Guide to Mass; longer prayers link to the USCCB', license: '© 2010 ICEL; short excerpts, credited' },
  { name: 'Catholic Mass 101 (Ascension Presents)', url: 'https://www.youtube.com/watch?v=RS8NrJ0Y5O8', provides: 'The video on the Guide to Mass, played from YouTube only when you press play', license: 'Embedded under YouTube’s terms; not copied' },
  { name: 'API.Bible', url: 'https://api.bible', provides: 'Optional modern translations', license: 'Per-translation license, non-commercial use' },
  { name: 'OpenBible.info Bible Geocoding Data', url: 'https://www.openbible.info/geo/', provides: 'Every place on the then-and-now map: where it was, how confident scholars are, and the verses that name it', license: 'CC BY 4.0' },
  { name: 'Digital Atlas of the Roman Empire', url: 'https://dh.gu.se/dare/', provides: 'The Roman-era map', license: '[Confirm before launch: CC BY 4.0 per the latest notice]' },
  { name: 'OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright', provides: 'Today’s map, and the churches on the Support a parish map (searched through the Overpass API)', license: 'ODbL' },
  { name: 'Leaflet', url: 'https://leafletjs.com', provides: 'The interactive maps', license: 'BSD 2-Clause' },
  { name: 'Wikidata', url: 'https://www.wikidata.org', provides: 'Linked facts about people and places', license: 'CC0', planned: true },
  { name: 'OpenAlex', url: 'https://openalex.org', provides: 'Finding scholarly research', license: 'CC0', planned: true },
  { name: 'catholic-mass-readings (Python package)', url: 'https://pypi.org/project/catholic-mass-readings/', provides: <>Reads the <ScholarDefinition term="usccb" /> readings page once a day</>, license: 'Open source (Apache 2.0)' },
];

export default function Sources() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['translations'],
    queryFn: () => apiGet<Translation[]>('/translations'),
    staleTime: 24 * 60 * 60 * 1000,
  });

  return (
    <main>
      <h1 className="title-rule">Sources and APIs</h1>
      <p style={{ margin: '20px 0 0', maxWidth: '56ch' }}>
        The data behind this site comes from open projects and{' '}
        <ScholarDefinition term="publicDomain">public-domain</ScholarDefinition> texts. Each one is credited wherever
        it appears.
      </p>

      <div className="table-wrap" style={{ marginTop: 32 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>What it provides</th>
              <th>License or terms</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((s) => (
              <tr key={s.name}>
                <td>
                  <a href={s.url}>{s.name}</a>
                  {s.planned && <span className="small-note"> (coming soon)</span>}
                </td>
                <td>{s.provides}</td>
                <td>{s.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small-note" style={{ marginTop: 14 }}>
        Something missing or credited wrongly? <Link to="/contact">Let me know</Link>.
      </p>

      <section style={{ marginTop: 48, maxWidth: '64ch' }}>
        <h2 style={{ margin: 0, fontSize: 28 }}>Visit counts</h2>
        <p>
          To learn which pages help people most, the site counts page views and clicks as daily totals, such as
          “14 visits to the map today.” It doesn’t use cookies or store anything that identifies you, and it never
          reads what you type. If your browser sends Do Not Track or Global Privacy Control, you aren’t counted.
        </p>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2 style={{ margin: 0, fontSize: 28 }}>Bible translations</h2>
        <p style={{ maxWidth: '64ch' }}>
          Copyrighted translations are provided by <a href="https://api.bible">API.Bible</a> and shown exactly as
          supplied, without changes.
        </p>
        {isPending && <Skeleton height={120} />}
        {isError && <p>The list of translations couldn’t be loaded. Please try again later.</p>}
        <div style={{ display: 'grid', gap: 14 }}>
          {data?.map((t) => (
            <article key={t.code} className="card">
              <h3 style={{ margin: '0 0 6px', fontSize: 20 }}>
                {t.name} ({t.code})
              </h3>
              <p style={{ margin: 0 }} className="muted">
                {t.license}
                {t.translated_from ? `. Translated from ${t.translated_from}.` : '.'}
              </p>
              {(t.citation ?? t.copyright_notice) && (
                <p style={{ margin: '10px 0 0', fontSize: 15 }}>{t.citation ?? t.copyright_notice}</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
