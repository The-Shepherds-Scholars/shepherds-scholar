import { Link } from 'react-router-dom';
import ScholarDefinition from '../components/ScholarDefinition';
import TodayReadingsCard from './TodayReadingsCard';

const EXPLORE: Array<[string, string, string]> = [
  ['/timeline', 'Timeline', 'From the Patriarchs to the early Church, with dates shown as honest ranges.'],
  ['/map', 'Then and now map', 'Slide between the Roman-era map and today’s.'],
  ['/mass', 'A beginner’s guide to Mass', 'What happens at Mass and what to expect.'],
  ['/miracles', 'Miracles', 'Investigated events, inspired by St. Carlo Acutis.'],
  ['/angels', 'Angels and demons', 'What Scripture says, what the Church teaches, what history records.'],
  ['/about', 'About me', 'Who built this, and why.'],
];

export default function Home() {
  return (
    <main>
      <p style={{ color: 'var(--accent)', fontWeight: 500, margin: 0 }}>For believers, seekers, and the curious</p>
      <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', margin: '12px 0 0', maxWidth: '15ch' }}>Faith that is not afraid of the details</h1>
      <p className="lead">
        Scripture and the historical record, side by side, with every statement labeled so you always know which is which.
        Scripture comes from the <ScholarDefinition term="publicDomain">public-domain</ScholarDefinition>{' '}
        <ScholarDefinition term="douayRheims" /> translation, word for word.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
        <Link to="/map" className="button">Compare then and now</Link>
      </div>

      <section style={{ marginTop: 56 }}>
        <TodayReadingsCard />
      </section>

      <section style={{ marginTop: 56 }}>
        <h2>Explore the site</h2>
        <div className="grid">
          {EXPLORE.map(([to, title, blurb]) => (
            <Link key={to} to={to} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{title}</strong>
              <span className="muted" style={{ display: 'block', marginTop: 6 }}>{blurb}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
