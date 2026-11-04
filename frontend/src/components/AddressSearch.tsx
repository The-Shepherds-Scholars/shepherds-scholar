import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

// Address box with suggestions as you type, for Support a parish.
//   - Suggestions come from Photon (https://photon.komoot.io), a free OpenStreetMap search built for
//     search-as-you-type. Nominatim's policy forbids that use, so Nominatim is only used when the
//     visitor presses Search without picking a suggestion (see ParishMap.tsx).
//   - Photon is free under fair use, so we wait until typing pauses, need 3+ characters, cancel
//     stale requests, and remember answers we already have.
//   - What's typed goes only to Photon, never to this site's server.
// The box follows the ARIA combobox pattern: arrow keys move through suggestions, Enter picks one,
// Escape closes the list.

const PHOTON_URL = 'https://photon.komoot.io/api/';
const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;
const SHOWN = 5;
// Leave out businesses and attractions so suggestions are addresses, streets, towns, and ZIP codes.
const EXCLUDED_TAGS = ['amenity', 'shop', 'tourism', 'leisure', 'office', 'craft', 'healthcare'];

export interface Place {
  lat: number;
  lon: number;
  label: string;
}

interface Props {
  busy: boolean;
  lookingUp: boolean;
  /** Visitor pressed Search (or Enter) without picking a suggestion. */
  onSearchText: (text: string) => void;
  /** Visitor picked a suggestion. */
  onPick: (place: Place) => void;
}

const cache = new Map<string, Place[]>();

export default function AddressSearch({ busy, lookingUp, onSearchText, onPick }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const skipNext = useRef(false);

  useEffect(() => {
    const q = text.trim();
    if (skipNext.current) {
      skipNext.current = false; // the text was just set by picking a suggestion; don't search again
      return;
    }
    if (q.length < MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const key = q.toLowerCase();
    const cached = cache.get(key);
    if (cached) {
      show(cached);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await suggest(q, controller.signal);
        cache.set(key, found);
        show(found);
      } catch {
        // Suggestions are a convenience; if Photon is down, the Search button still works.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
      setLoading(false);
    };
  }, [text]);

  function show(found: Place[]) {
    setSuggestions(found);
    setActive(-1);
    setOpen(found.length > 0);
  }

  function pick(place: Place) {
    skipNext.current = true;
    setText(place.label);
    setOpen(false);
    setActive(-1);
    onPick(place);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (open && active >= 0) {
      pick(suggestions[active]);
      return;
    }
    const q = text.trim();
    if (!q) return;
    setOpen(false);
    onSearchText(q);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 20 }}>
      <label htmlFor={`${id}-input`} style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
        Or search near an address, city, or ZIP code
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 0 }}>
          <input
            id={`${id}-input`}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
            autoComplete="off"
            placeholder="e.g. 123 Main St, Chicago, IL or 60601"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => setOpen(false)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            maxLength={200}
            style={{
              width: '100%', minHeight: 48, padding: '10px 14px', fontSize: 17,
              border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <ul
            id={listId}
            role="listbox"
            aria-label="Address suggestions"
            hidden={!open}
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 10,
              margin: 0, padding: 4, listStyle: 'none', background: '#fff',
              border: '1px solid var(--line)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            }}
          >
            {suggestions.map((s, i) => (
              <li
                key={`${s.lat},${s.lon},${i}`}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown, not click, so the pick happens before the input's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setActive(i)}
                style={{
                  padding: '10px 12px', minHeight: 44, borderRadius: 8, cursor: 'pointer', fontSize: 16,
                  color: '#1b2230', background: i === active ? '#eef2f6' : 'transparent',
                }}
              >
                {s.label}
              </li>
            ))}
          </ul>
          {loading && !open && (
            <div
              className="muted"
              style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 10, padding: '12px 14px',
                fontSize: 15, background: '#fff', border: '1px solid var(--line)', borderRadius: 10,
              }}
            >
              Looking for matches…
            </div>
          )}
        </div>
        <button type="submit" className="button" disabled={busy || !text.trim()} style={{ background: '#2E4A6B' }}>
          {lookingUp ? 'Looking up…' : 'Search'}
        </button>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {open ? `${suggestions.length} suggestions. Use the up and down arrows to choose one.` : ''}
      </p>
    </form>
  );
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
}

async function suggest(q: string, signal: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q, limit: '10', lang: 'en' });
  for (const tag of EXCLUDED_TAGS) params.append('osm_tag', `!${tag}`);
  const res = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const body = (await res.json()) as { features?: PhotonFeature[] };
  const home = homeCountry();
  const seen = new Set<string>();
  return (body.features ?? [])
    // Photon ranks other countries highly (typing "6060" suggests Perth first), so put the
    // visitor's own country first. The sort is stable, so Photon's order holds within each group.
    .sort((a, b) => Number(b.properties.countrycode === home) - Number(a.properties.countrycode === home))
    .map((f) => ({ lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], label: labelFor(f.properties, home) }))
    .filter((p) => !seen.has(p.label) && seen.add(p.label))
    .slice(0, SHOWN);
}

/** The visitor's country from their browser language (en-US → US), defaulting to the US. */
function homeCountry(): string {
  const region = (navigator.language || '').split('-')[1];
  return region && region.length === 2 ? region.toUpperCase() : 'US';
}

function labelFor(p: Record<string, string | undefined>, home: string): string {
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const isPostcode = p.type === 'other' && p.osm_value === 'postcode';
  const first = isPostcode ? null : street ? (p.name && p.name !== p.housenumber ? `${p.name}, ${street}` : street) : p.name;
  const town = p.city && p.city !== p.name ? p.city : null;
  const statePost = [p.state, isPostcode ? p.name : p.postcode].filter(Boolean).join(' ');
  const country = p.countrycode === home ? null : p.country;
  return [first, town, statePost, country].filter(Boolean).join(', ');
}
