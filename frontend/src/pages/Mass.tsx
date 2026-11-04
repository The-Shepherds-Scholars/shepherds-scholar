import ScholarDefinition from '../components/ScholarDefinition';
import VideoEmbed from '../components/VideoEmbed';
import { ORDER_OF_MASS, ORDER_OF_MASS_URL, type Line, type Step } from '../data/orderOfMass';

// A beginner's guide to Mass: design concept pages 5 and 6, wireframe 7, plus the order of Mass
// step by step with the prayers (data/orderOfMass.tsx). Gold Eucharist palette.

const FOUR_PARTS = [
  {
    name: 'Introductory Rites',
    about: <>The opening: a procession, the Sign of the Cross, a moment to ask God’s mercy, and an opening prayer.</>,
  },
  {
    name: 'Liturgy of the Word',
    about: (
      <>
        Readings from Scripture, a sung or spoken <ScholarDefinition term="psalm">Psalm</ScholarDefinition>, the{' '}
        <ScholarDefinition term="gospel">Gospel</ScholarDefinition>, and the priest’s{' '}
        <ScholarDefinition term="homily">homily</ScholarDefinition>.
      </>
    ),
  },
  {
    name: 'Liturgy of the Eucharist',
    about: (
      <>
        Bread and wine are offered and <ScholarDefinition term="consecrated">consecrated</ScholarDefinition>, followed
        by the <ScholarDefinition term="ourFather">Our Father</ScholarDefinition> and{' '}
        <ScholarDefinition term="communion">Holy Communion</ScholarDefinition>.
      </>
    ),
  },
  {
    name: 'Concluding Rites',
    about: <>A final blessing, and everyone is sent out to live what they have received.</>,
  },
];

export default function Mass() {
  return (
    <main style={{ maxWidth: 960 }}>
      <h1 style={{ margin: 0 }}>A beginner’s guide to Mass</h1>
      <p className="lead">
        Whether it’s your first <ScholarDefinition term="mass" /> ever or your first in a long time, you are welcome.
        Here is what to expect, so you can focus less on what to do and more on why you came.
      </p>
      <p className="small-note">Words with a dotted underline have a short explanation. Hover over them, or tap them on a phone.</p>

      <aside className="card" style={{ borderLeft: '6px solid var(--accent)', marginTop: 28 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontFamily: 'var(--font-body)', fontWeight: 700 }}>A note before you start</h2>
        <p style={{ margin: 0 }}>
          I’m still learning too. This guide isn’t an official Church resource. Until it has been reviewed by the
          Church, I can only share what I know, along with trusted guides like the ones linked on this page. If anything
          here differs from what your parish or priest tells you, follow them.
        </p>
        <p style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)' }}>
          Above all, remember this: come with respect, and with a heart that truly wants to be with God. Everything
          else can be learned.
        </p>
      </aside>

      <section style={{ marginTop: 48 }}>
        <h2>Watch first</h2>
        <VideoEmbed
          videoId="RS8NrJ0Y5O8"
          title="Catholic Mass 101: Learn Every Part of the Mass and What It Means"
          byline="with Fr. Mike Schmitz, from Ascension Presents"
        />
        <p className="small-note" style={{ marginTop: 8 }}>
          The video plays from YouTube. Nothing loads from YouTube until you press play.{' '}
          <a href="https://www.youtube.com/watch?v=RS8NrJ0Y5O8">Watch on YouTube instead</a>.
        </p>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2 style={{ marginBottom: 4 }}>The four parts of the Mass</h2>
        <p className="muted" style={{ marginTop: 0 }}>Every Mass follows the same shape, wherever in the world you go.</p>
        <ol className="grid" style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {FOUR_PARTS.map((p, i) => (
            <li key={p.name} className="card card--gold" style={{ background: 'var(--surface)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>{i + 1}</span>
              <h3 style={{ margin: '4px 0 8px', fontSize: 19, fontFamily: 'var(--font-body)', fontWeight: 700 }}>{p.name}</h3>
              <p style={{ margin: 0, fontSize: 17 }}>{p.about}</p>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ marginTop: 48 }} aria-labelledby="step-by-step">
        <h2 id="step-by-step" style={{ marginBottom: 4 }}>Step by step, with the prayers</h2>
        <p className="muted" style={{ marginTop: 0, maxWidth: '64ch' }}>
          Open each part to follow along: what happens, whether to stand, sit, or kneel, and what to say. Your answers
          are in <strong style={{ color: 'var(--ink)' }}>bold</strong>. Longer prayers show their first words, with the{' '}
          <a href={ORDER_OF_MASS_URL}>full text at the USCCB</a>.
        </p>
        <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
          {ORDER_OF_MASS.map((part, i) => (
            <details key={part.name} className="card" style={{ padding: 0 }} open={i === 0}>
              <summary style={{ cursor: 'pointer', padding: '18px 22px', fontFamily: 'var(--font-display)', fontSize: 22 }}>
                <span style={{ color: 'var(--accent)', marginRight: 10 }}>{i + 1}</span>
                {part.name}
                <span className="small-note" style={{ fontFamily: 'var(--font-body)', marginLeft: 10 }}>
                  {part.steps.length} steps
                </span>
              </summary>
              <ol style={{ listStyle: 'none', margin: 0, padding: '0 22px 22px', display: 'grid', gap: 14 }}>
                {part.steps.map((step) => (
                  <MassStep key={step.name} step={step} />
                ))}
              </ol>
            </details>
          ))}
        </div>
        <p className="small-note" style={{ marginTop: 14 }}>
          Excerpts from the English translation of <cite>The Roman Missal</cite> © 2010, International Commission on
          English in the Liturgy Corporation. All rights reserved. Postures follow the usual practice in the United
          States; parishes vary a little.
        </p>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2>Good to know</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="card">
            <h3 style={goodTitle}>Arrive a few minutes early</h3>
            <p style={{ margin: 0 }}>It gives you time to settle in, silence your phone, and pray quietly before Mass begins.</p>
          </div>
          <div className="card">
            <h3 style={goodTitle}>Follow the people around you</h3>
            <p style={{ margin: 0 }}>
              You will sit, stand, and kneel at different moments. Do what you can, and nobody expects you to know the
              cues yet. Many <ScholarDefinition term="parish">parishes</ScholarDefinition> keep a booklet in the{' '}
              <ScholarDefinition term="pew">pews</ScholarDefinition> with the prayers and responses, and simply
              listening is fine.
            </p>
          </div>
          <div className="card">
            <h3 style={goodTitle}>A sign of reverence</h3>
            <p style={{ margin: 0 }}>
              Many Catholics <ScholarDefinition term="genuflect">genuflect</ScholarDefinition>, bending the right knee
              toward the <ScholarDefinition term="tabernacle">tabernacle</ScholarDefinition>, before entering the pew. A
              bow is a fine alternative.
            </p>
          </div>
          <div className="card">
            <h3 style={goodTitle}>About Communion</h3>
            <p style={{ margin: 0 }}>
              Catholics who are prepared receive <ScholarDefinition term="communion">Communion</ScholarDefinition>, and
              they normally <ScholarDefinition term="fast">fast</ScholarDefinition> for one hour beforehand. If you
              aren’t Catholic, or aren’t ready to receive, you are still welcome: stay in your pew and pray. Some
              parishes invite people to come forward for a blessing instead, so follow what your parish does.
            </p>
            <p style={{ margin: '12px 0 0' }}>
              <a href="https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass/liturgy-of-the-eucharist/guidelines-for-the-reception-of-communion">
                Read the US bishops’ guidelines for receiving Communion
              </a>
            </p>
          </div>
        </div>
      </section>

      <p className="small-note" style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        Draft guide, drafted with AI help and still being checked against Church sources.
      </p>
    </main>
  );
}

function MassStep({ step }: { step: Step }) {
  return (
    <li>
      {step.begins && (
        <h3 style={{ margin: '10px 0 12px', fontSize: 18, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
          {step.begins}
        </h3>
      )}
      <div style={{ borderLeft: '3px solid #b08a3e', paddingLeft: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 12px' }}>
          <strong style={{ fontSize: 18 }}>{step.name}</strong>
          <span className="chip" style={{ color: '#5c4510', fontSize: 13, padding: '2px 8px' }}>{step.posture}</span>
          {step.when && <span className="small-note">{step.when}</span>}
        </div>
        <p style={{ margin: '6px 0 0' }}>{step.about}</p>

        {step.fullText && (
          <blockquote style={{ margin: '10px 0 0', padding: '10px 14px', background: '#fbf8f0', borderRadius: 8, fontWeight: 700 }}>
            {step.fullText.map((line) => (
              <span key={line} style={{ display: 'block' }}>{line}</span>
            ))}
          </blockquote>
        )}

        {step.lines && <Dialogue lines={step.lines} />}

        {step.opening && (
          <p style={{ margin: '10px 0 0' }}>
            <strong>“{step.opening}”</strong>{' '}
            <a href={ORDER_OF_MASS_URL} style={{ fontSize: 15 }}>Full text</a>
          </p>
        )}

        {step.scripture && <p className="small-note" style={{ margin: '6px 0 0' }}>From Scripture: {step.scripture}</p>}
      </div>
    </li>
  );
}

function Dialogue({ lines }: { lines: Line[] }) {
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 14px', margin: '10px 0 0' }}>
      {lines.map((l, i) => {
        const yours = l.who === 'Everyone' || l.who === 'You';
        return (
          <div key={i} style={{ display: 'contents' }}>
            <dt className="muted" style={{ fontSize: 15 }}>{l.who}</dt>
            <dd style={{ margin: 0, fontWeight: yours ? 700 : 400 }}>{l.text}</dd>
          </div>
        );
      })}
    </dl>
  );
}

const goodTitle = { margin: '0 0 6px', fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 700 } as const;
