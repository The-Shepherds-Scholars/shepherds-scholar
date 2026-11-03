import { lazy, Suspense, useCallback, useId, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import GlossaryText from '../components/GlossaryText';
import ScholarDefinition from '../components/ScholarDefinition';
import Skeleton from '../components/Skeleton';
import { PassageText } from '../features/scripture/PassageText';
import { CONFIDENCE, placeLabel, usePlace, usePlaces, type Candidate, type PlaceSummary } from '../lib/places';

// The Holy Land, then and now: wireframe 4 and design concept page 3.
// Every place named in the Bible (1,300+, from OpenBible.info) is a dot on the map; clicking a dot,
// a featured chip, or a search result focuses the map on that place and opens it in the panel.
// MapCompare (Leaflet) loads only on this page. The selected place lives in ?place= so it can be shared.
const MapCompare = lazy(() => import('../components/MapCompare'));
const NO_CANDIDATES: Candidate[] = [];
const FIRST_VERSES = 8;

export default function MapPage() {
  const [params, setParams] = useSearchParams();
  const places = usePlaces();
  const all = places.data ?? [];
  const featured = useMemo(() => all.filter((p) => p.featured_order !== null), [all]);
  const selected = params.get('place') ?? featured[0]?.slug ?? null;
  const place = usePlace(selected);
  const candidates = place.data?.slug === selected ? place.data.candidates : NO_CANDIDATES;

  const select = useCallback((slug: string) => setParams({ place: slug }, { replace: true }), [setParams]);

  return (
    <main>
      <h1 style={{ margin: 0 }}>The Holy Land, then and now</h1>
      <p style={{ margin: '14px 0 0', maxWidth: '62ch' }}>
        Slide to compare the <ScholarDefinition term="romanEra">Roman-era</ScholarDefinition> map with today’s.
        Every place named in the Bible is a dot: choose one to see what Scripture says, what history can show, and
        how sure scholars are about where it was.
      </p>

      <div
        style={{
          display: 'grid', gap: 24, marginTop: 28, alignItems: 'start',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
        }}
      >
        <div>
          <Suspense fallback={<Skeleton height={460} delayMs={0} />}>
            <MapCompare places={all} selected={selected} candidates={candidates} onSelect={select} />
          </Suspense>
          <p className="small-note" style={{ marginTop: 10 }}>
            Drag the round handle across the map to compare. Left of it is the Roman era, right of it is today. With
            a keyboard, focus the handle and use the arrow keys. Click any dot to focus on that place.
          </p>
        </div>

        <section className="card" style={{ padding: 24 }}>
          {places.isPending && <Skeleton height={40} />}
          {places.isError && <p>The places couldn’t be loaded. The server may be waking up, so try again in a minute.</p>}
          {all.length > 0 && (
            <>
              <PlaceSearch places={all} onSelect={select} />
              <PlaceChips places={featured} selected={selected} onSelect={select} />
            </>
          )}
          <div aria-live="polite">
            <PlacePanel slug={selected} />
          </div>
        </section>
      </div>
    </main>
  );
}

function PlaceSearch({ places, onSelect }: { places: PlaceSummary[]; onSelect: (s: string) => void }) {
  const [query, setQuery] = useState('');
  const inputId = useId();
  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length < 2) return [];
    const starts = places.filter((p) => p.name.toLowerCase().startsWith(q));
    const contains = places.filter(
      (p) => !p.name.toLowerCase().startsWith(q) &&
        (p.name.toLowerCase().includes(q) || (p.modern_name ?? '').toLowerCase().includes(q)),
    );
    return [...starts, ...contains].slice(0, 8);
  }, [places, q]);

  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={inputId} style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>
        Find a place
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${places.length.toLocaleString()} places, like Bethel or Ur`}
        autoComplete="off"
        style={{ width: '100%', minHeight: 44, padding: '0 14px', font: 'inherit', border: '1px solid #8c8580', borderRadius: 8 }}
      />
      {q.length >= 2 && (
        <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, border: '1px solid var(--line)', borderRadius: 8 }}>
          {results.length === 0 && <li style={{ padding: '10px 14px' }} className="muted">No places match “{query}”.</li>}
          {results.map((p) => (
            <li key={p.slug} style={{ borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={() => {
                  onSelect(p.slug);
                  setQuery('');
                }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', font: 'inherit', background: 'none', border: 0, cursor: 'pointer' }}
              >
                {placeLabel(p)}
                {p.latitude === null && <span className="small-note"> · not on the map</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlaceChips({ places, selected, onSelect }: { places: PlaceSummary[]; selected: string | null; onSelect: (s: string) => void }) {
  return (
    <div role="group" aria-label="Featured places" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {places.map((p) => {
        const on = p.slug === selected;
        return (
          <button
            key={p.slug}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(p.slug)}
            style={{
              minHeight: 40, padding: '0 16px', borderRadius: 999, font: 'inherit', fontSize: 15, cursor: 'pointer',
              border: `1px solid ${on ? 'var(--accent)' : '#c9cdd2'}`,
              background: on ? 'var(--accent)' : '#fff', color: on ? '#fff' : 'var(--ink)',
            }}
          >
            {p.name}
          </button>
        );
      })}
    </div>
  );
}

function PlacePanel({ slug }: { slug: string | null }) {
  const { data: place, isPending, isError } = usePlace(slug);
  const [openPassage, setOpenPassage] = useState<string | null>(null);
  const [showAllVerses, setShowAllVerses] = useState(false);
  const [lastSlug, setLastSlug] = useState(slug);
  if (slug !== lastSlug) {
    // A new place: close any open passage and collapse the verse list.
    setLastSlug(slug);
    setOpenPassage(null);
    setShowAllVerses(false);
  }

  if (!slug) return null;
  if (isPending) {
    return (
      <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        <Skeleton width="50%" height={30} />
        <Skeleton height={80} />
      </div>
    );
  }
  if (isError || !place) return <p style={{ marginTop: 20 }}>This place couldn’t be loaded. Please try again.</p>;

  const conf = CONFIDENCE[place.location_confidence];
  const imported = place.data_source === 'openbible';
  const verses = showAllVerses ? place.passages : place.passages.slice(0, FIRST_VERSES);

  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ margin: 0, fontSize: 30 }}>{place.name}</h2>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 20px', margin: '14px 0 0' }}>
        <dt className="muted">Then</dt>
        <dd style={{ margin: 0, fontFamily: 'var(--font-display)' }}>{place.ancient_name}</dd>
        <dt className="muted">Today</dt>
        <dd style={{ margin: 0 }}>{place.modern_name ?? 'Not known for certain'}</dd>
        <dt className="muted">Location</dt>
        <dd style={{ margin: 0 }}>
          <ScholarDefinition term={conf.term}>{conf.label}</ScholarDefinition>
        </dd>
      </dl>
      {place.latitude === null && place.candidates.length === 0 && (
        <p className="small-note" style={{ marginTop: 10 }}>This place has no known location, so it isn’t on the map.</p>
      )}

      {place.notes && (
        <p style={{ margin: '16px 0 0' }}>
          <GlossaryText text={place.notes} />
        </p>
      )}

      {place.candidates.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <h3 style={subhead}>Proposed sites</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {place.candidates.map((c) => (
              <li key={c.label + c.latitude} style={{ borderLeft: '3px solid #6B1E3A', paddingLeft: 12 }}>
                <strong style={{ fontWeight: 500 }}>{c.label}</strong>{' '}
                <span className="muted" style={{ fontSize: 15 }}>
                  (<ScholarDefinition term={CONFIDENCE[c.confidence].term}>{CONFIDENCE[c.confidence].label.toLowerCase()}</ScholarDefinition>)
                </span>
                {c.note && (
                  <span style={{ display: 'block', fontSize: 16 }}>
                    <GlossaryText text={c.note} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {place.passages.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <h3 style={subhead}>
            Read it in Scripture{place.passages.length > FIRST_VERSES ? ` (${place.passages.length} verses)` : ''}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 14px' }}>
            {verses.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-expanded={openPassage === p.id}
                onClick={() => setOpenPassage(openPassage === p.id ? null : p.id)}
                style={{
                  font: 'inherit', fontSize: 16, padding: '4px 0', background: 'none', border: 0, cursor: 'pointer',
                  color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                {p.reference}
              </button>
            ))}
          </div>
          {place.passages.length > FIRST_VERSES && (
            <button
              type="button"
              onClick={() => setShowAllVerses(!showAllVerses)}
              style={{ font: 'inherit', fontSize: 15, marginTop: 6, background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--muted)', textDecoration: 'underline' }}
            >
              {showAllVerses ? 'Show fewer' : `Show all ${place.passages.length} verses`}
            </button>
          )}
          {openPassage && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <PassageText passageId={openPassage} />
            </div>
          )}
        </section>
      )}

      {place.events.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <h3 style={subhead}>Events here</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {place.events.map((e) => (
              <li key={e.slug}><Link to={`/events/${e.slug}`}>{e.title}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <div className="small-note" style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'grid', gap: 6 }}>
        {place.notes && place.notes_status === 'draft' && <span>Draft note, drafted with AI help and still being checked against sources.</span>}
        {imported && (
          <span>
            Location, confidence, and verses from{' '}
            {place.source_url ? <a href={place.source_url}>OpenBible.info</a> : 'OpenBible.info'} (
            <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>). Verse numbers follow Protestant Bibles,
            so a few may differ in the Douay-Rheims.
          </span>
        )}
      </div>
    </div>
  );
}

const subhead = { margin: '0 0 8px', fontSize: 16, fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--muted)' } as const;
