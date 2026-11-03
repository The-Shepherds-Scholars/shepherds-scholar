import { lazy, Suspense } from 'react';
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
  { name: 'Catholic Relief Services', url: 'https://www.crs.org', blurb: 'The US bishops’ international relief and development agency' },
  { name: 'Catholic Charities USA', url: 'https://www.catholiccharitiesusa.org', blurb: 'Local services for people in need across the United States' },
];

export default function Parish() {
  return (
    <main>
      <h1 className="title-rule">Support the Church near you</h1>
      <p style={{ margin: '20px 0 0', maxWidth: '56ch' }}>
        This site doesn’t take donations. If it has helped you, consider giving to a local{' '}
        <ScholarDefinition term="parish">parish</ScholarDefinition> or a Catholic charity instead.
      </p>

      <div
        style={{ display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', marginTop: 36, alignItems: 'start' }}
      >
        <section aria-label="Churches near you">
          <Suspense fallback={<Skeleton height={360} delayMs={0} />}>
            <ParishMap />
          </Suspense>
        </section>

        <section>
          <h2 style={{ margin: '0 0 14px', fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 700 }}>Catholic charities</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {CHARITIES.map((c) => (
              <a key={c.name} href={c.url} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong style={{ display: 'block', fontSize: 19 }}>{c.name}</strong>
                <span className="muted" style={{ display: 'block', marginTop: 4, fontSize: 16 }}>{c.blurb}</span>
              </a>
            ))}
          </div>
          <p className="small-note" style={{ marginTop: 14 }}>
            Most parishes also accept gifts directly, in person or through their own website.
          </p>
        </section>
      </div>
    </main>
  );
}
