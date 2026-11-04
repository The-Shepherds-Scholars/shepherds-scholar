import type React from 'react';
import ScholarDefinition from './ScholarDefinition';
import { ClaimLabelRow } from './ClaimLabel';
import { ComingSoon } from './StatusTag';

// "How it works" from the design concept: four steps, then the six claim labels.
// Shared by the Home page and the "About this site" page.
const STEPS: Array<{ title: string; body: React.ReactNode; soon?: boolean }> = [
  {
    title: 'Follow the timeline',
    soon: true,
    body: (
      <>
        Move from the <ScholarDefinition term="patriarchs">Patriarchs</ScholarDefinition> to the early Church.
        Dates are shown as ranges with how confident historians are.
      </>
    ),
  },
  {
    title: 'See the places',
    body: <>Compare the Roman-era map with today’s. When scholars disagree about a site, every candidate is shown.</>,
  },
  {
    title: 'Read the labels',
    body: (
      <>
        Each statement says what kind of claim it is, so you know whether you are reading Scripture, Church
        teaching, or historical research.
      </>
    ),
  },
  {
    title: 'Check the sources',
    body: <>Every historical claim links to its sources: ancient writers, archaeology reports, and scholarship.</>,
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="band" style={{ scrollMarginTop: 80 }}>
      <div className="container">
        <h2 style={{ margin: 0, fontSize: 32 }}>How it works</h2>
        <p className="muted" style={{ margin: '8px 0 0', maxWidth: '56ch' }}>
          Every event is built from small statements, and each one carries a label, so faith and history stay side
          by side without being mixed up.
        </p>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 24 }}>
          {STEPS.map((s) => (
            <div key={s.title} className="card">
              {s.soon && <ComingSoon />}
              <h3 style={{ margin: s.soon ? '8px 0 8px' : '0 0 8px', fontSize: 20, fontFamily: 'var(--font-body)', fontWeight: 700 }}>{s.title}</h3>
              <p style={{ margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
        <h3 style={{ margin: '32px 0 12px', fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 700 }}>
          The labels you will see
        </h3>
        <ClaimLabelRow />
      </div>
    </section>
  );
}
