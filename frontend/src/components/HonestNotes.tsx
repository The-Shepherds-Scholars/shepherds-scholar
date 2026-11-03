import ScholarDefinition from './ScholarDefinition';

// "Honest notes" from the design concept: a deep blue band (Jesus palette) with gold headings.
// Shared by the Home page and the "About this site" page. Copy is the site owner's own.
const gold = { color: '#e2c27a', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 20, margin: '0 0 8px' };

export default function HonestNotes() {
  return (
    <section className="band band--navy" aria-labelledby="honest-notes">
      <div className="container">
        <h2 id="honest-notes" style={{ margin: '0 0 28px', fontSize: 32 }}>Honest notes</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px 40px' }}>
          <div>
            <h3 style={gold}>Free, always</h3>
            <p style={{ margin: 0 }}>No ads, no paywall, no account needed to explore.</p>
          </div>
          <div>
            <h3 style={gold}>A work in progress</h3>
            <p style={{ margin: 0 }}>
              Events, places, and sources are added a few at a time, and each one is checked before it goes up. If
              you spot a mistake, please tell me.
            </p>
          </div>
          <div>
            <h3 style={gold}>How AI was used</h3>
            <p style={{ margin: 0 }}>
              Yes, AI was used here. Mostly it was a coding partner, helping write the code and organize data so it
              can be shown on this site.
            </p>
            <p style={{ margin: '12px 0 0' }}>
              It also drafted a few short notes, such as the place descriptions on the map and the notes on each
              book’s original language. Each of those is checked against sources, and stays marked as a draft until
              it has been.
            </p>
            <p style={{ margin: '12px 0 0' }}>
              AI was not used to write or reword Scripture or Church teaching. Scripture comes from the{' '}
              <ScholarDefinition term="publicDomain">public-domain</ScholarDefinition>{' '}
              <ScholarDefinition term="douayRheims">Douay-Rheims</ScholarDefinition> translation, word for word.
            </p>
          </div>
          <div>
            <h3 style={gold}>Keep digging</h3>
            <p style={{ margin: 0 }}>
              This site is a starting point, not the last word. Read the sources, talk with your parish, and let your
              questions grow your faith, or simply satisfy your inner nerd.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
