import { Link } from 'react-router-dom';
import ContinuePathway from '../components/ContinuePathway';
import HowItWorks from '../components/HowItWorks';
import HonestNotes from '../components/HonestNotes';
import { ComingSoon } from '../components/StatusTag';
import TodayReadingsCard from './TodayReadingsCard';

// Home, styled after the design concept (page 1), with the wireframe's readings card and
// "Continue your pathway" (wireframe 1, callouts 3 and 4). Bands run edge to edge.

const EXPLORE: Array<[string, string, string, boolean?]> = [
  ['/map', 'Then and now map', 'Slide between the Roman-era map and today’s, and see how sure scholars are about each place.'],
  ['/timeline', 'Timeline', 'From the Patriarchs to the early Church, with dates shown as honest ranges.', true],
  ['/mass', 'A beginner’s guide to Mass', 'What happens at Mass and what to expect, whether it’s your first time or your first in a while.'],
  ['/miracles', 'Miracles', 'Investigated events, inspired by St. Carlo Acutis, with where the evidence stops and faith begins.'],
  ['/angels', 'Angels and demons', 'What Scripture says, what the Church teaches, and what history records.'],
  ['/about', 'About me', 'Who built this, and why.'],
  ['/parish', 'Support a parish', 'Find a Catholic church near you, or give to a Catholic charity.'],
  ['/sources', 'Sources and APIs', 'Every text, dataset, and service behind the site, with its license.'],
  ['/contact', 'Contact', 'Ask a question, suggest a source, or point out a mistake.'],
];

export default function Home() {
  return (
    <main className="bands">
      <section className="hero">
        <div
          className="container"
          style={{ display: 'grid', gap: 40, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'end' }}
        >
          <div>
            <p className="eyebrow">For believers, seekers, and the curious</p>
            <h1 style={{ fontSize: 'clamp(42px, 6vw, 64px)', margin: '14px 0 0', maxWidth: '13ch' }}>
              Faith that is not afraid of the details
            </h1>
            <p style={{ margin: '24px 0 0', maxWidth: '54ch' }}>
              Some of us understand best when we can see the evidence: the places, the dates, the old texts, and what
              the Church teaches about them. This site puts Scripture and the historical record side by side, and
              labels every statement so you always know which is which.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <Link to="/map" className="button">Compare then and now</Link>
              <a href="#how" className="button button--outline">How it works</a>
            </div>
          </div>
          <div>
            <TodayReadingsCard />
            <ContinuePathway />
          </div>
        </div>
      </section>

      <section className="band band--surface">
        <div className="container">
          <h2 style={{ margin: '0 0 24px', fontSize: 32 }}>Explore the site</h2>
          <div className="grid">
            {EXPLORE.map(([to, title, blurb, soon]) => (
              <Link key={to} to={to} className="card card--gold" style={{ textDecoration: 'none', color: 'inherit' }}>
                {soon && <ComingSoon />}
                <h3 style={{ margin: soon ? '8px 0 0' : 0, fontSize: 22 }}>{title}</h3>
                <p className="muted" style={{ margin: '6px 0 0', fontSize: 16 }}>{blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />
      <HonestNotes />
    </main>
  );
}
