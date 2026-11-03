import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import { themeFor } from '../theme';

// Wraps every page: shared nav, page colors, footer. Sets the theme as CSS variables on
// <html> so links, buttons, and ScholarDefinition all follow the route's saint palette.
export default function AppShell() {
  const { pathname } = useLocation();
  const theme = themeFor(pathname);

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent', theme.accent);
    root.setProperty('--ground', theme.ground);
    root.setProperty('--sdef-accent', theme.accent);
    window.scrollTo(0, 0);
  }, [theme, pathname]);

  return (
    <>
      <NavBar />
      <Outlet />
      <footer style={{ borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, fontSize: 15, color: 'var(--muted)' }}>
          <span>The Shepherd’s Scholar. Free, ad-free, and a work in progress.</span>
          <Link to="/contact">Contact</Link>
        </div>
      </footer>
    </>
  );
}
