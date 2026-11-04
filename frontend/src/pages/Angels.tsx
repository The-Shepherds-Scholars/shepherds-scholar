import type { CSSProperties } from 'react';
import ScholarDefinition from '../components/ScholarDefinition';
import { BeingChecked } from '../components/StatusTag';
import './FaithPages.css';

// Ported from the "Angels and demons" artboard in the design canvas.
// Theme: St. Michael (night), with his red cloak as the second accent.
// Needs a priest's review before launch.

const PAGE_TOKENS = {
  '--fp-line': '#CDD4DC',
  '--fp-body': '#2F3A48',
  '--fp-muted': '#4B5765',
  '--fp-red': '#A3282E',
  '--fp-steel': '#2E4A6B',
  '--fp-dark': '#1B2A41',
  '--fp-on-dark': '#E8EDF3',
} as CSSProperties;

const ARCHANGELS = [
  { name: 'Michael', role: 'The protector who leads the fight against evil.', refs: 'Daniel 10 and 12, Jude 9, Revelation 12:7' },
  { name: 'Gabriel', role: 'The messenger who announced Jesus’s birth to Mary.', refs: 'Daniel 8 and 9, Luke 1' },
  { name: 'Raphael', role: 'The healer and guide who travels with Tobias.', refs: 'Tobit 5 to 12' },
];

export default function Angels() {
  return (
    <main className="fp fp-angels" style={PAGE_TOKENS}>
      <h1>Angels and demons</h1>
      <p className="lead">
        What Scripture says, what the Church teaches, and what history records, told calmly and without sensation.
      </p>

      <aside aria-labelledby="faith-title" className="fp-dark">
        <h2 id="faith-title">A matter of faith, not lab proof</h2>
        <p>
          Angels and demons are spiritual beings, and science has no instrument that can detect a spirit, so it can neither
          prove nor disprove them. Belief in them rests on faith: on Scripture and the teaching of the Church.
        </p>
        <p>
          What history can show is what people believed and how the Church acted. What medicine can do is rule out
          illness, and the Church requires exactly that before it ever treats a case as spiritual.
        </p>
      </aside>

      <section className="fp-section">
        <h2>The archangels named in Scripture</h2>
        <p className="fp-intro">
          Three angels are named in Catholic Bibles. One of them appears only in a{' '}
          <ScholarDefinition term="deuterocanonical">deuterocanonical</ScholarDefinition> book.
        </p>
        <div className="fp-grid">
          {ARCHANGELS.map((a) => (
            <div key={a.name} className={`fp-card fp-archangel${a.name === 'Michael' ? ' fp-archangel--michael' : ''}`}>
              <h3>{a.name}</h3>
              <p>{a.role}</p>
              <p className="fp-small">{a.refs}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fp-section">
        <h2>What the Church teaches</h2>
        <div className="fp-stack" style={{ marginTop: 16 }}>
          <p className="fp-card"><strong>Angels are real, spiritual creatures</strong> who serve God and watch over people. <span className="fp-cite">Catechism 328 to 336</span></p>
          <p className="fp-card"><strong>Some angels freely rejected God.</strong> The Church calls them fallen angels, or demons, with Satan as their leader. <span className="fp-cite">Catechism 391 to 395</span></p>
          <p className="fp-card"><strong>Their power is limited.</strong> They cannot stop God’s plan, and Christ has already defeated them.</p>
          <p className="fp-card"><strong>Exorcism is rare and careful.</strong> Before one is performed, the Church must first be sure the person is not suffering from an illness. <span className="fp-cite">Catechism 1673</span></p>
        </div>
      </section>

      <section className="fp-section">
        <h2>The words the Church uses</h2>
        <p className="fp-intro">
          Exorcists and theologians separate kinds of evil influence, from the most common to the rarest. These terms come
          from the Church’s pastoral tradition, not from formal definitions in the{' '}
          <ScholarDefinition term="catechism">Catechism</ScholarDefinition>. Older books used only temptation, obsession,
          and possession; “oppression” was added in the late twentieth century.
        </p>
        <dl className="fp-stack fp-terms">
          <div className="fp-card">
            <dt>Temptation</dt>
            <dd>The ordinary pull toward sin that everyone experiences. Prayer, the sacraments, and good choices are the answer.</dd>
          </div>
          <div className="fp-card">
            <dt>Obsession</dt>
            <dd>An attack on the mind: persistent, tormenting thoughts believed to come from outside the person.</dd>
          </div>
          <div className="fp-card">
            <dt>Oppression</dt>
            <dd>An attack from outside on the body or a person’s circumstances. Also called vexation.</dd>
          </div>
          <div className="fp-card">
            <dt>Infestation</dt>
            <dd>Evil influence associated with a place or an object rather than a person.</dd>
          </div>
          <div className="fp-card fp-rarest">
            <dt>Possession</dt>
            <dd>
              The rarest: an evil spirit believed to act through a person’s body. It is the only case that calls for a
              formal <ScholarDefinition term="exorcism">exorcism</ScholarDefinition>, which only a priest appointed by his
              bishop may perform.
            </dd>
          </div>
        </dl>
        <p className="fp-note" style={{ marginTop: 18 }}>
          The difference that matters most: obsession works on the mind from outside, while possession is believed to act
          through the body itself. Telling them apart is the work of experienced priests, together with doctors.
        </p>
      </section>

      <section className="fp-section">
        <h2 style={{ marginBottom: 16 }}>In history</h2>
        <ol className="fp-stack fp-history">
          <li className="fp-card">
            <strong>1614</strong>
            <span>The Rite of Exorcism is published in the <ScholarDefinition term="romanRitual">Roman Ritual</ScholarDefinition>, and stays in use for centuries.</span>
          </li>
          <li className="fp-card">
            <strong>1880s</strong>
            <span>Pope Leo XIII writes the <ScholarDefinition term="stMichaelPrayer">Prayer to St. Michael</ScholarDefinition>, still prayed in many parishes after Mass.</span>
          </li>
          <li className="fp-card">
            <strong>1999</strong>
            <span>The Church publishes a revised rite, which keeps the requirement to rule out illness first.</span>
          </li>
        </ol>
      </section>

      <section aria-labelledby="help-title" className="fp-card fp-section fp-help" style={{ padding: '24px 28px' }}>
        <h2 id="help-title">If something here troubles you</h2>
        <p style={{ maxWidth: '64ch' }}>
          Talk to both a priest and a doctor. Most troubles that feel spiritual have causes a doctor can help with, and a
          priest can walk with you in prayer whatever the cause. You don’t have to figure it out alone.
        </p>
      </section>

      <p className="fp-draft"><BeingChecked /> Draft page, drafted with AI help. To be reviewed by a priest before it is published.</p>
    </main>
  );
}
