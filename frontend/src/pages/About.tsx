import { Link } from 'react-router-dom';

// About me, styled after the design concept (page 4) and wireframe 9. Guadalupe palette.
// The bracketed text is yours to write. To add your photo, put it in frontend/public/ (for example
// frontend/public/lupe.jpg) and set PHOTO to its path, with alt text that describes it.
const PHOTO: { src: string; alt: string } | null = null;

export default function About() {
  return (
    <main style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start', maxWidth: 1040 }}>
      <div style={{ flex: '0 1 280px', width: '100%' }}>
        {PHOTO ? (
          <img src={PHOTO.src} alt={PHOTO.alt} style={{ width: '100%', borderRadius: 12, display: 'block' }} />
        ) : (
          <div
            style={{
              aspectRatio: '4 / 5', border: '2px dashed #b08a3e', borderRadius: 12, background: '#fff',
              display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 15,
            }}
          >
            [Your photo]
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 360px', minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(38px, 5vw, 48px)', color: 'var(--accent)' }}>About me</h1>
        <p style={{ margin: '18px 0 0', fontFamily: 'var(--font-display)', fontSize: 24, color: '#A8394C' }}>Hi, I’m Lupe.</p>
        <p style={{ maxWidth: '58ch' }}>
          [Your story: your journey through faith and life, the late baptism at seven or eight, what felt murky, and
          what led you to build this.]
        </p>
        <p style={{ maxWidth: '58ch' }}>[Why the nerdy side matters to you, and who you hope this helps.]</p>
        <p style={{ maxWidth: '58ch' }}>[What you are working on next.]</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
          <Link className="button" to="/contact">Get in touch</Link>
          <a className="button button--outline" href="/#how" style={{ color: '#A8394C', borderColor: '#A8394C' }}>
            How this site works
          </a>
        </div>
      </div>
    </main>
  );
}
