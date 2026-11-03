import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import LiquidFill from './LiquidFill';
import { themeFor } from '../theme';
import './NavBar.css';

const LINKS: Array<[string, string]> = [
  ['/', 'Home'],
  ['/timeline', 'Timeline'],
  ['/map', 'Then and now map'],
  ['/readings', 'Daily readings'],
  ['/mass', 'Guide to Mass'],
  ['/miracles', 'Miracles'],
  ['/angels', 'Angels and demons'],
  ['/search', 'Search'],
  ['/about', 'About me'],
  ['/parish', 'Support a parish'],
  ['/sources', 'Sources and APIs'],
  ['/contact', 'Contact'],
];

const FILL_MS = 4000;

// Stays mounted between routes (it lives in AppShell), so it always knows the color it is
// leaving and can pour the next one in.
export default function NavBar() {
  const { pathname } = useLocation();
  const accent = themeFor(pathname).accent;
  const [menuOpen, setMenuOpen] = useState(false);
  const [from, setFrom] = useState('#5B6470');
  const lastAccent = useRef<string | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    if (lastAccent.current) setFrom(lastAccent.current);
    lastAccent.current = accent;
  }, [pathname, accent]);

  return (
    <header className="nav" style={{ background: from }}>
      <div className="nav-bar">
        <LiquidFill key={pathname} to={accent} durationMs={FILL_MS} />
        <div className="nav-row">
          <Link to="/" className="nav-logo">The Shepherd’s Scholar</Link>
          <div className="nav-actions">
            <span className="nav-badge">Free, work in progress</span>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <X size={24} aria-hidden="true" />
              ) : (
                // A Latin cross (lucide's "Cross" is the equal-armed medical kind)
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3v18M6 8.5h12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <nav id="site-menu" aria-label="Site" className="nav-menu">
          <div className="nav-menu-grid">
            {LINKS.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className="nav-link"
                style={({ isActive }) => (isActive ? { color: accent, fontWeight: 700 } : undefined)}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
