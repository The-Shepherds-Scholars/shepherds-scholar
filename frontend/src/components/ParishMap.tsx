import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Skeleton from './Skeleton';
import AddressSearch, { type Place } from './AddressSearch';

// Map of nearby Catholic churches for Support a parish (wireframe 10), built on free, keyless services:
//   - Leaflet (BSD-2) draws the map.
//   - OpenStreetMap tiles. Usage policy: https://operations.osmfoundation.org/policies/tiles/
//     It requires the "© OpenStreetMap contributors" credit on the map, which Leaflet shows below.
//   - The Overpass API searches OpenStreetMap for Catholic places of worship near the visitor.
//     https://wiki.openstreetmap.org/wiki/Overpass_API
//   - Nominatim (OpenStreetMap's geocoder) turns a typed address into a map point, for visitors who
//     don't share their location. Usage policy: https://operations.osmfoundation.org/policies/nominatim/
//     It allows at most one request per second and no search-as-you-type, so we only look up an
//     address when the visitor presses Search without picking a suggestion.
//   - Suggestions while typing come from Photon instead (see AddressSearch.tsx).
// Location is asked for only when the visitor taps the button, and is sent only to Overpass,
// never to this site's own server. A typed address goes only to Photon and Nominatim, never to this site.

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_MIN_GAP_MS = 1100;
const SEARCH_RADIUS_M = 15000;
const MAX_RESULTS = 40;
const LIST_IN_VIEW = 3;
const SLOW_AFTER_MS = 6000;
const GIVE_UP_AFTER_MS = 90000;
// The Latin (Roman) Church and the Eastern Catholic Churches in full communion with Rome, as
// OpenStreetMap spells them. Old Catholic and Anglo-Catholic churches are not in communion with Rome
// and are deliberately left out.
const CATHOLIC_DENOMINATIONS = [
  'catholic',
  'roman_catholic',
  'latin_catholic',
  'eastern_catholic',
  'greek_catholic',
  'ukrainian_greek_catholic',
  'ruthenian_catholic',
  'byzantine_catholic',
  'melkite',
  'maronite',
  'chaldean_catholic',
  'syriac_catholic',
  'syro-malabar',
  'syro-malankara',
  'armenian_catholic',
  'coptic_catholic',
  'ethiopian_catholic',
  'romanian_greek_catholic',
  'slovak_greek_catholic',
];
const US_CENTER: L.LatLngTuple = [39.5, -98.35];

interface Church {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address: string | null;
  website: string | null;
  distanceKm: number;
}

type Status = 'idle' | 'locating' | 'geocoding' | 'searching' | 'done' | 'denied' | 'failed' | 'not-found';

let lastGeocodeAt = 0;

/** `noteSlot`: where the privacy note moves once a search has started (the bottom of the page). */
export default function ParishMap({ noteSlot }: { noteSlot?: HTMLElement | null }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [churches, setChurches] = useState<Church[]>([]);
  const [searchedFrom, setSearchedFrom] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const [listHeight, setListHeight] = useState<number | undefined>(undefined);

  // Overpass can take 30 seconds or more when it's busy, so say so instead of leaving visitors guessing.
  useEffect(() => {
    if (status !== 'searching') {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [status]);

  // Show the 3 closest churches and scroll for the rest. Measured, because addresses can wrap and
  // make cards different heights. Re-measured when the column width changes.
  useEffect(() => {
    const el = list.current;
    if (!el) {
      setListHeight(undefined);
      return;
    }
    const measure = () => {
      const items = el.children;
      if (items.length <= LIST_IN_VIEW) {
        setListHeight(undefined);
        return;
      }
      const last = items[LIST_IN_VIEW - 1] as HTMLElement;
      // A sliver of the 4th card shows, so it's clear the list scrolls.
      setListHeight(last.offsetTop + last.offsetHeight + 28);
    };
    measure();
    el.scrollTop = 0;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [churches, status]);

  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const m = L.map(mapEl.current, { scrollWheelZoom: false }).setView(US_CENTER, 4);
    const tiles = L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION });
    tiles.once('load', () => setTilesLoaded(true));
    tiles.addTo(m);
    markers.current = L.layerGroup().addTo(m);
    map.current = m;
    // The map grows to match the search column beside it, so Leaflet must redraw when its size changes.
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(mapEl.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);

  function findNearMe() {
    if (!('geolocation' in navigator)) {
      setStatus('failed');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => searchFrom(coords.latitude, coords.longitude, null),
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    );
  }

  async function findNearAddress(q: string) {
    setStatus('geocoding');
    try {
      const place = await geocode(q);
      if (!place) {
        setStatus('not-found');
        return;
      }
      await searchFrom(place.lat, place.lon, place.label);
    } catch {
      setStatus('failed');
    }
  }

  function findNearPlace(place: Place) {
    void searchFrom(place.lat, place.lon, place.label);
  }

  async function searchFrom(lat: number, lon: number, label: string | null) {
    setStatus('searching');
    try {
      const found = await searchChurches(lat, lon);
      setChurches(found);
      setSearchedFrom(label);
      showOnMap(lat, lon, found, label ? 'The address you entered' : 'You are here');
      setStatus('done');
    } catch {
      setStatus('failed');
    }
  }

  function showOnMap(lat: number, lon: number, found: Church[], startLabel: string) {
    const m = map.current;
    const layer = markers.current;
    if (!m || !layer) return;
    layer.clearLayers();
    L.circleMarker([lat, lon], { radius: 7, color: '#2E4A6B', fillColor: '#2E4A6B', fillOpacity: 1 })
      .bindTooltip(startLabel)
      .addTo(layer);
    for (const c of found) {
      L.circleMarker([c.lat, c.lon], {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: '#A3282E',
        fillOpacity: 1,
      })
        .bindPopup(popupHtml(c))
        .addTo(layer);
    }
    const points: L.LatLngTuple[] = [
      [lat, lon],
      ...found.slice(0, 10).map((c): L.LatLngTuple => [c.lat, c.lon]),
    ];
    m.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 14 });
  }

  useEffect(() => {
    if (status !== 'idle') setSearchedOnce(true);
  }, [status]);

  const busy = status === 'locating' || status === 'geocoding' || status === 'searching';

  return (
    <div className="parish-layout">
      {/* isolation keeps Leaflet's layers (z-index 400+) below the sticky nav bar. */}
      <div
        className="parish-map"
        style={{
          isolation: 'isolate',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--line)',
        }}
      >
        {!tilesLoaded && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 500 }} aria-hidden="true">
            <Skeleton height="100%" radius={0} delayMs={0} />
          </div>
        )}
        <div
          ref={mapEl}
          role="region"
          aria-label="Map of nearby Catholic churches"
          style={{ flex: '1 1 auto', minHeight: 'var(--parish-map-height)', background: '#e8ecef' }}
        />
      </div>

      <div className="parish-side">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button
            type="button"
            className="button"
            onClick={findNearMe}
            disabled={busy}
            style={{ background: '#2E4A6B' }}
          >
            {status === 'locating'
              ? 'Finding you…'
              : status === 'searching'
                ? 'Searching…'
                : 'Find churches near me'}
          </button>
          <a
            className="button button--outline"
            href="https://www.google.com/maps/search/catholic+church+near+me"
            style={{ color: '#2E4A6B', borderColor: '#2E4A6B' }}
          >
            Open in Google Maps
          </a>
        </div>

        <AddressSearch
          busy={busy}
          lookingUp={status === 'geocoding'}
          onSearchText={findNearAddress}
          onPick={findNearPlace}
        />

        {/* Shown under the search until the first search starts, since it matters most before someone
            shares their location; then it moves to the bottom of the page to free up room. */}
        {searchedOnce && noteSlot ? createPortal(privacyNote, noteSlot) : privacyNote}

        <div aria-live="polite">
          {busy && (
            <section className="parish-results" aria-busy="true">
              <p style={{ margin: '0 0 4px', fontWeight: 700 }}>
                {status === 'locating'
                  ? 'Finding your location…'
                  : status === 'geocoding'
                    ? 'Finding that address on the map…'
                    : 'Searching OpenStreetMap for Catholic churches nearby…'}
              </p>
              {slow && (
                <p className="muted" style={{ margin: '0 0 4px', fontSize: 15 }}>
                  Still working. OpenStreetMap’s church search is shared by many sites and can take up to a
                  minute when it’s busy.
                </p>
              )}
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }} aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={78} radius={12} delayMs={0} />
                ))}
              </div>
            </section>
          )}
          {status === 'denied' && (
            <p>
              Location wasn’t shared, so the map can’t search near you. You can type an address, city, or ZIP
              code above instead.
            </p>
          )}
          {status === 'not-found' && (
            <p>We couldn’t find that address. Try adding the city and state, or just a ZIP code.</p>
          )}
          {status === 'failed' && (
            <p>
              The church search didn’t work just now. OpenStreetMap’s search may be busy. Please try again in
              a minute, or use Google Maps.
            </p>
          )}
          {status === 'done' && churches.length === 0 && (
            <p>
              No Catholic churches were found within {SEARCH_RADIUS_M / 1000} km on OpenStreetMap. Try Google
              Maps instead.
            </p>
          )}
          {status === 'done' && churches.length > 0 && (
            <section className="parish-results">
              <h3
                style={{ margin: '0 0 10px', fontSize: 20, fontFamily: 'var(--font-body)', fontWeight: 700 }}
              >
                {churches.length} {churches.length === 1 ? 'church' : 'churches'} nearby
              </h3>
              {searchedFrom && (
                <p className="muted" style={{ margin: '0 0 12px', fontSize: 15 }}>
                  Near: {searchedFrom}
                </p>
              )}
              <ol
                ref={list}
                tabIndex={churches.length > LIST_IN_VIEW ? 0 : undefined}
                aria-label={`Churches, closest first${churches.length > LIST_IN_VIEW ? '. Scroll to see more' : ''}`}
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: '0 6px 0 0',
                  display: 'grid',
                  gap: 10,
                  position: 'relative',
                  maxHeight: listHeight,
                  overflowY: listHeight ? 'auto' : undefined,
                  overscrollBehavior: 'contain',
                }}
              >
                {churches.map((c) => (
                  <li key={c.id} className="card" style={{ padding: '14px 18px' }}>
                    <strong style={{ display: 'block' }}>{c.name}</strong>
                    <span className="muted" style={{ fontSize: 15 }}>
                      {c.distanceKm.toFixed(1)} km{c.address ? ` · ${c.address}` : ''}
                    </span>
                    <span style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 15 }}>
                      <a href={directionsUrl(c)}>Directions</a>
                      {c.website && <a href={c.website}>Parish website</a>}
                    </span>
                  </li>
                ))}
              </ol>
              {churches.length > LIST_IN_VIEW && (
                <p className="muted" style={{ margin: '8px 0 0', fontSize: 14 }}>
                  Showing the {LIST_IN_VIEW} closest. Scroll the list to see all {churches.length}.
                </p>
              )}
            </section>
          )}
          {(status === 'done' || status === 'failed') && (
            <p className="small-note" style={{ marginTop: 16 }}>
              Missing a church? The list comes from OpenStreetMap, which anyone can improve.{' '}
              <a href="https://www.openstreetmap.org/fixthemap">Add or fix a church on OpenStreetMap</a>, or
              check your diocese’s parish directory.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Turn a typed address into a map point with Nominatim. Returns null when nothing matches. */
async function geocode(q: string): Promise<{ lat: number; lon: number; label: string } | null> {
  const wait = lastGeocodeAt + NOMINATIM_MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((done) => setTimeout(done, wait));
  lastGeocodeAt = Date.now();
  const params = new URLSearchParams({ q, format: 'jsonv2', limit: '1', addressdetails: '0' });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'Accept-Language': navigator.language || 'en' },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  const first = results[0];
  if (!first) return null;
  return { lat: Number(first.lat), lon: Number(first.lon), label: first.display_name };
}

async function searchChurches(lat: number, lon: number): Promise<Church[]> {
  // No result limit on the query: Overpass returns elements in its own order, not nearest first, so a
  // limit there dropped nearby churches in busy cities. We sort by distance here and keep the nearest.
  // No religion=christian filter either: some Catholic churches are tagged without it.
  const query = `[out:json][timeout:60];
nwr["amenity"="place_of_worship"]["denomination"~"^(${CATHOLIC_DENOMINATIONS.join('|')})$"](around:${SEARCH_RADIUS_M},${lat},${lon});
out center tags;`;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(GIVE_UP_AFTER_MS),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const body = (await res.json()) as { elements: OverpassElement[] };
  return body.elements
    .map((el) => toChurch(el, lat, lon))
    .filter((c): c is Church => c !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_RESULTS);
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function toChurch(el: OverpassElement, fromLat: number, fromLon: number): Church | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat === undefined || lon === undefined) return null;
  const t = el.tags ?? {};
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  const address = [street, t['addr:city']].filter(Boolean).join(', ') || null;
  const website = safeUrl(t.website ?? t['contact:website']);
  return {
    id: `${el.type}/${el.id}`,
    name: t.name ?? 'Catholic church (name not listed)',
    lat,
    lon,
    address,
    website,
    distanceKm: haversineKm(fromLat, fromLon, lat, lon),
  };
}

/** Only allow http(s) links from map data. */
function safeUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function directionsUrl(c: Church): string {
  return `https://www.openstreetmap.org/directions?to=${c.lat}%2C${c.lon}`;
}

const privacyNote = (
  <p className="small-note" style={{ marginTop: 12 }}>
    Your location is used only to search OpenStreetMap for churches nearby, and a typed address only to find it
    and suggest matches on OpenStreetMap. Neither is sent to this site or saved. Church listings come from
    OpenStreetMap volunteers and may be incomplete, so check Mass times with the parish.
  </p>
);

function popupHtml(c: Church): string {
  const el = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = c.name; // set as text, never as HTML, since it comes from map data
  el.appendChild(name);
  if (c.address) {
    const addr = document.createElement('div');
    addr.textContent = c.address;
    el.appendChild(addr);
  }
  const link = document.createElement('a');
  link.href = directionsUrl(c);
  link.textContent = 'Directions';
  el.appendChild(document.createElement('br'));
  el.appendChild(link);
  return el.outerHTML;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
