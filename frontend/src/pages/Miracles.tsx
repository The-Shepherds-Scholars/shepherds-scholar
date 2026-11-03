import type { CSSProperties } from 'react';
import ScholarDefinition from '../components/ScholarDefinition';
import './FaithPages.css';

// Ported from the "Miracles" artboard in the design canvas. Theme: Our Lady of Guadalupe (gown).

type Status = 'recognized' | 'investigating' | 'not-recognized';

const STATUS_LABEL: Record<Status, string> = {
  recognized: 'Recognized by the Church',
  investigating: 'Under investigation',
  'not-recognized': 'Not recognized',
};

interface MiracleRecord {
  kind: 'Eucharistic miracle' | 'Healing' | 'Canonization miracle';
  name: string;
  place: string;
  year: string;
  status: Status | null; // null until researched
  summary: string;
  investigatedBy: string;
  sources: Array<{ label: string; url: string }>;
}

// Placeholders on purpose: fill each one in only from checked Church and scientific sources.
const RECORDS: MiracleRecord[] = [
  {
    kind: 'Eucharistic miracle', name: '[Name of the miracle]', place: '[Place]', year: '[Year]', status: null,
    summary: '[One-line summary of what was reported]', investigatedBy: '[who], [year]', sources: [],
  },
  {
    kind: 'Healing', name: '[Name of the healing]', place: '[Place]', year: '[Year]', status: null,
    summary: '[One-line summary of what was reported]', investigatedBy: '[who], [year]', sources: [],
  },
  {
    kind: 'Canonization miracle', name: '[Name of the case]', place: '[Place]', year: '[Year]', status: null,
    summary: '[One-line summary of what was reported]', investigatedBy: '[who], [year]', sources: [],
  },
];

const PAGE_TOKENS = {
  '--fp-line': '#EAD9DC',
  '--fp-body': '#3D3437',
  '--fp-muted': '#5C5054',
  '--fp-accent-dark': '#82283A',
  '--fp-dark': '#2B2226',
  '--fp-on-dark': '#E6D9DC',
} as CSSProperties;

export default function Miracles() {
  return (
    <main className="fp" style={PAGE_TOKENS}>
      <h1>Miracles</h1>
      <p className="lead">
        Events the Church has investigated and found no natural explanation for, with what was examined, who examined
        it, and where the evidence stops and faith begins.
      </p>

      <section aria-labelledby="carlo-title" className="fp-card fp-feature">
        <h2 id="carlo-title">Inspired by St. Carlo Acutis</h2>
        <p style={{ maxWidth: '64ch' }}>
          As a teenager, Carlo Acutis built a website cataloguing{' '}
          <ScholarDefinition term="eucharisticMiracle">Eucharistic miracles</ScholarDefinition> from around the world,
          with their history and the scientific studies done on them. He died in 2006 at 15, and was{' '}
          <ScholarDefinition term="canonized">canonized</ScholarDefinition> in 2025 as the first millennial saint. This
          section follows his idea: gather the evidence, show it clearly, and let it point people toward Christ.
        </p>
        <a href="https://www.miracolieucaristici.org">Visit St. Carlo’s own catalogue of Eucharistic miracles</a>
      </section>

      <section className="fp-section">
        <h2>How to read a miracle record</h2>
        <p className="fp-intro">Every record keeps three things apart, so you always know what kind of statement you are reading.</p>
        <div className="fp-grid">
          <div className="fp-card">
            <h3>What was reported</h3>
            <p>The event as witnesses and records describe it: when, where, and who was there.</p>
          </div>
          <div className="fp-card">
            <h3>What was investigated</h3>
            <p>Who examined it, how, and what they found, including any medical or laboratory tests and their limits.</p>
          </div>
          <div className="fp-card">
            <h3>What faith says</h3>
            <p>What the Church concluded, and what believers see in it. This is where evidence ends and faith begins.</p>
          </div>
        </div>

        <h3 style={{ margin: '36px 0 12px', fontSize: 19 }}>The status each record carries</h3>
        <ul className="fp-statuses">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <li key={s} className={`fp-status fp-status--${s}`}>{STATUS_LABEL[s]}</li>
          ))}
        </ul>
        <p className="fp-note">
          Claims the Church looked into and did not recognize are included too. They show how carefully these cases are examined.
        </p>
      </section>

      <section className="fp-section">
        <h2 style={{ marginBottom: 20 }}>The records</h2>
        <div className="fp-grid fp-records">
          {RECORDS.map((r, i) => (
            <article key={i} className="fp-card fp-record">
              <p className="fp-kind">{r.kind}</p>
              <h3>{r.name}</h3>
              <p className="fp-place">{r.place} · {r.year}</p>
              <span className={`fp-status fp-status--small${r.status ? ` fp-status--${r.status}` : ''}`}>
                {r.status ? STATUS_LABEL[r.status] : '[Status]'}
              </span>
              <p className="fp-summary">{r.summary}</p>
              <p className="fp-small">
                Investigated by {r.investigatedBy}. Sources:{' '}
                {r.sources.length
                  ? r.sources.map((s, j) => (
                      <span key={s.url}>{j > 0 && ', '}<a href={s.url}>{s.label}</a></span>
                    ))
                  : '[links]'}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="science-title" className="fp-dark">
        <h2 id="science-title">What science can and can’t say</h2>
        <p>
          Doctors and scientists can show that they found no natural explanation for something, using the tools they have
          today. They cannot show that God caused it. That last step is faith, and every record here says so.
        </p>
        <p>
          The Church judges approved miracles worthy of belief, but no Catholic is required to believe in any particular
          one. Test results that were never published for other scientists to check are marked as debated.
        </p>
      </section>

      <p className="fp-draft">
        Draft page, drafted with AI help. Every record will be checked against Church and scientific sources before it is published.
      </p>
    </main>
  );
}
