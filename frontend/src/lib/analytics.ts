// Visit and click counting, to see which pages and features people use most.
//
// Privacy, by design:
//   - Only counts are sent: "a view of /map", "a click on Emmaus on /map". The backend adds them to
//     daily totals (analytics_daily). No cookies, no IDs, nothing stored in the browser.
//   - Nothing typed into the site (search boxes, the contact form) is ever read.
//   - Visitors with Do Not Track or Global Privacy Control turned on are not counted.
//   - Off while developing on localhost, unless VITE_ANALYTICS=on is set.
//
// Reading the results: from backend/, run `python -m scripts.analytics_report`.
//
// To give a link or button a clearer name in the report, add data-track:
//   <Link to="/map" data-track="Home hero: Compare then and now">…</Link>

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const ENDPOINT = `${API}/api/v1/analytics`;
const FLUSH_EVERY_MS = 10_000;
const MAX_BATCH = 50;

type AnalyticsEvent = { kind: 'view' | 'click'; path: string; target?: string };

const queue: AnalyticsEvent[] = [];
let started = false;

function enabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.DEV && import.meta.env.VITE_ANALYTICS !== 'on') return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === '1' || nav.globalPrivacyControl === true) return false;
  if (nav.webdriver) return false; // automated browsers and test runs
  return true;
}

/** Count a page view. Call on every route change. */
export function trackPageView(path: string): void {
  if (!enabled()) return;
  queue.push({ kind: 'view', path: cleanPath(path) });
}

/** Count a click with an explicit name (for clicks the automatic listener can't see). */
export function trackClick(target: string, path = window.location.pathname): void {
  if (!enabled()) return;
  queue.push({ kind: 'click', path: cleanPath(path), target: target.slice(0, 120) });
}

/** Start listening for clicks and sending batches. Safe to call more than once. */
export function startAnalytics(): void {
  if (started || !enabled()) return;
  started = true;
  document.addEventListener('click', onClick, { capture: true });
  window.setInterval(() => flush(false), FLUSH_EVERY_MS);
  // Send what's left when the visitor leaves or switches tabs.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true);
  });
}

function onClick(e: MouseEvent): void {
  const el = (e.target as Element | null)?.closest<HTMLElement>('a, button, [role="button"], [data-track]');
  if (!el) return;
  const target = labelFor(el);
  if (target) trackClick(target);
}

/** A short, readable name for what was clicked. Never reads form fields. */
function labelFor(el: HTMLElement): string | null {
  if (el.closest('input, textarea, select, [contenteditable="true"]')) return null;
  const named = el.dataset.track;
  if (named) return named;
  const text = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (el.classList.contains('sdef-trigger')) return text ? `Definition: ${text}` : null;
  if (text) return text;
  const href = el.getAttribute('href');
  return href ? `Link: ${href.slice(0, 100)}` : null;
}

/** Only the path is counted: no query string or #fragment, which could carry personal details. */
function cleanPath(path: string): string {
  const p = path.split(/[?#]/)[0].replace(/[^A-Za-z0-9/_-]/g, '').slice(0, 200);
  return p.startsWith('/') ? p : `/${p}`;
}

function flush(leaving: boolean): void {
  while (queue.length > 0) {
    const events = queue.splice(0, MAX_BATCH);
    // text/plain keeps this a "simple" request, so a beacon can send it to the API on another domain.
    const body = new Blob([JSON.stringify({ events })], { type: 'text/plain' });
    const sent = leaving && navigator.sendBeacon?.(ENDPOINT, body);
    if (!sent) {
      fetch(ENDPOINT, { method: 'POST', body, keepalive: true, credentials: 'omit' }).catch(() => {
        // Counting is best-effort; a failed send is simply dropped.
      });
    }
  }
}
