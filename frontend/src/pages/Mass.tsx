import ScholarDefinition from '../components/ScholarDefinition';

// Wireframe 7. Copy matches the design canvas; definitions come from data/glossary.ts.
export default function Mass() {
  return (
    <main style={{ maxWidth: 960 }}>
      <h1>A beginner’s guide to Mass</h1>
      <p className="lead">
        Whether it’s your first <ScholarDefinition term="mass" /> ever or your first in a long time, you are welcome.
      </p>
      <aside className="card" style={{ borderLeft: '6px solid var(--accent)', marginTop: 28 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontFamily: 'var(--font-body)' }}>A note before you start</h2>
        <p style={{ margin: 0 }}>
          I’m still learning too. This guide isn’t an official Church resource. Until it has been reviewed by the Church,
          I can only share what I know, along with trusted guides. If anything here differs from what your parish or priest
          tells you, follow them.
        </p>
        <p style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)' }}>
          Above all, remember this: come with respect, and with a heart that truly wants to be with God. Everything else can be learned.
        </p>
      </aside>
      <section style={{ marginTop: 40 }}>
        <h2>Watch first</h2>
        <a className="button" href="https://www.youtube.com/watch?v=RS8NrJ0Y5O8">
          Catholic Mass 101 with Fr. Mike Schmitz, on YouTube
        </a>
      </section>
      <section style={{ marginTop: 40 }}>
        <h2>Good to know</h2>
        <p>
          Many Catholics <ScholarDefinition term="genuflect">genuflect</ScholarDefinition>, bending the right knee toward the{' '}
          <ScholarDefinition term="tabernacle">tabernacle</ScholarDefinition>, before entering the <ScholarDefinition term="pew">pew</ScholarDefinition>.
        </p>
        <p>
          Catholics who are prepared receive <ScholarDefinition term="communion">Communion</ScholarDefinition>, and they normally{' '}
          <ScholarDefinition term="fast">fast</ScholarDefinition> for one hour beforehand.
        </p>
      </section>
      <p className="todo">To finish: move the rest of the copy over from the design canvas (wireframe 7).</p>
    </main>
  );
}
