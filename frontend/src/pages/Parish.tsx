import { lazy, Suspense, useState } from 'react';
import ScholarDefinition from '../components/ScholarDefinition';
import Skeleton from '../components/Skeleton';

// The map (Leaflet) loads only on this page, so other pages don't download it.
const ParishMap = lazy(() => import('../components/ParishMap'));

// Support a parish, styled after the design concept (page 12) and wireframe 10.
// The site itself never asks for money (API.Bible's non-commercial rules). These are plain links
// to other organizations: no banners, pop-ups, or donation prompts.
// The church map uses OpenStreetMap and the Overpass API (free, no key) instead of the concept's Google
// Maps embed, which needs a Google Cloud billing account.

const CHARITIES = [
  {
    name: 'Catholic Relief Services',
    url: 'https://www.crs.org',
    blurb: 'The US bishops’ international relief and development agency',
  },
  {
    name: 'Catholic Charities USA',
    url: 'https://www.catholiccharitiesusa.org',
    blurb: 'Local services for people in need across the United States',
  },
  {
    name: 'Catholic Charities of New York',
    url: 'https://catholiccharitiesny.org',
    blurb: 'Help for New Yorkers in need, Catholic or not, across the Archdiocese of New York',
  },
];

export default function Parish() {
  // The map's privacy note moves here, to the bottom of the page, after the first search.
  const [noteSlot, setNoteSlot] = useState<HTMLDivElement | null>(null);
  return (
    <main>
      <h1 className="title-rule">Support the Church near you</h1>
      <p style={{ margin: '20px 0 0', maxWidth: '56ch' }}>
        This site doesn’t take donations. If it has helped you, consider giving to a local{' '}
        <ScholarDefinition term="parish">parish</ScholarDefinition> or a Catholic charity instead.
      </p>

      <section aria-label="Churches near you" style={{ marginTop: 36 }}>
        <Suspense fallback={<Skeleton height={360} delayMs={0} />}>
          <ParishMap noteSlot={noteSlot} />
        </Suspense>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 30, color: 'var(--accent)', textAlign: 'center' }}>
          Catholic charities
        </h2>
        <div style={{ display: 'grid', gap: 14 }}>
          {CHARITIES.map((c) => (
            <a
              key={c.name}
              href={c.url}
              className="card"
              style={{ textDecoration: 'none', color: 'inherit', padding: '20px 24px' }}
            >
              <strong style={{ display: 'block', fontSize: 21 }}>{c.name}</strong>
              <span className="muted" style={{ display: 'block', marginTop: 6, fontSize: 17 }}>
                {c.blurb}
              </span>
            </a>
          ))}
        </div>
        <p className="small-note" style={{ marginTop: 14 }}>
          Most parishes also accept gifts directly, in person or through their own website.
        </p>
      </section>

      <div ref={setNoteSlot} style={{ marginTop: 32, maxWidth: 760 }} />
    </main>
  );
}
