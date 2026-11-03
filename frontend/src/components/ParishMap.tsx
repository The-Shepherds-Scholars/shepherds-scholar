import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Skeleton from './Skeleton';

// Map of nearby Catholic churches for Support a parish (wireframe 10), built on free, keyless services:
//   - Leaflet (BSD-2) draws the map.
//   - OpenStreetMap tiles. Usage policy: https://operations.osmfoundation.org/policies/tiles/
//     It requires the "© OpenStreetMap contributors" credit on the map, which Leaflet shows below.
//   - The Overpass API searches OpenStreetMap for Catholic places of worship near the visitor.
//     https://wiki.openstreetmap.org/wiki/Overpass_API
// Location is asked for only when the visitor taps the button, and is sent only to Overpass,
// never to this site's own server.

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS_M = 15000;
const MAX_RESULTS = 40;
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

type Status = 'idle' | 'locating' | 'searching' | 'done' | 'denied' | 'failed';

export default function ParishMap() {
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [churches, setChurches] = useState<Church[]>([]);

  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const m = L.map(mapEl.current, { scrollWheelZoom: false }).setView(US_CENTER, 4);
    const tiles = L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION });
    tiles.once('load', () => setTilesLoaded(true));
    tiles.addTo(m);
    markers.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
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
      async ({ coords }) => {
        setStatus('searching');
        try {
          const found = await searchChurches(coords.latitude, coords.longitude);
          setChurches(found);
          showOnMap(coords.latitude, coords.longitude, found);
          setStatus('done');
        } catch {
          setStatus('failed');
        }
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    );
  }

  function showOnMap(lat: number, lon: number, found: Church[]) {
    const m = map.current;
    const layer = markers.current;
    if (!m || !layer) return;
    layer.clearLayers();
    L.circleMarker([lat, lon], { radius: 7, color: '#2E4A6B', fillColor: '#2E4A6B', fillOpacity: 1 })
      .bindTooltip('You are here')
      .addTo(layer);
    for (const c of found) {
      L.circleMarker([c.lat, c.lon], { radius: 8, color: '#fff', weight: 2, fillColor: '#A3282E', fillOpacity: 1 })
        .bindPopup(popupHtml(c))
        .addTo(layer);
    }
    const points: L.LatLngTuple[] = [[lat, lon], ...found.slice(0, 10).map((c): L.LatLngTuple => [c.lat, c.lon])];
    m.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 14 });
  }

  const busy = status === 'locating' || status === 'searching';

  return (
    <div>
      {/* isolation keeps Leaflet's layers (z-index 400+) below the sticky nav bar. */}
      <div style={{ position: 'relative', isolation: 'isolate', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
        {!tilesLoaded && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 500 }} aria-hidden="true">
            <Skeleton height="100%" radius={0} delayMs={0} />
          </div>
        )}
        <div
          ref={mapEl}
          role="region"
          aria-label="Map of nearby Catholic churches"
          style={{ height: 360, background: '#e8ecef' }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
        <button type="button" className="button" onClick={findNearMe} disabled={busy} style={{ background: '#2E4A6B' }}>
          {status === 'locating' ? 'Finding you…' : status === 'searching' ? 'Searching…' : 'Find churches near me'}
        </button>
        <a className="button button--outline" href="https://www.google.com/maps/search/catholic+church+near+me" style={{ color: '#2E4A6B', borderColor: '#2E4A6B' }}>
          Open in Google Maps
        </a>
      </div>

      <p className="small-note" style={{ marginTop: 12 }}>
        Your location is used only to search OpenStreetMap for churches nearby. It’s never sent to this site. Church
        listings come from OpenStreetMap volunteers and may be incomplete, so check Mass times with the parish.
      </p>

      <div aria-live="polite">
        {status === 'denied' && (
          <p>Location wasn’t shared, so the map can’t search near you. Google Maps can still find churches nearby.</p>
        )}
        {status === 'failed' && (
          <p>The church search didn’t work just now. Please try again in a minute, or use Google Maps.</p>
        )}
        {status === 'done' && churches.length === 0 && (
          <p>No Catholic churches were found within {SEARCH_RADIUS_M / 1000} km on OpenStreetMap. Try Google Maps instead.</p>
        )}
        {status === 'done' && churches.length > 0 && (
          <section style={{ marginTop: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 20, fontFamily: 'var(--font-body)', fontWeight: 700 }}>
              {churches.length} {churches.length === 1 ? 'church' : 'churches'} nearby
            </h3>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {churches.slice(0, 12).map((c) => (
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
          </section>
        )}
      </div>
    </div>
  );
}

async function searchChurches(lat: number, lon: number): Promise<Church[]> {
  const query = `[out:json][timeout:25];
nwr["amenity"="place_of_worship"]["religion"="christian"]["denomination"~"^(catholic|roman_catholic)$"](around:${SEARCH_RADIUS_M},${lat},${lon});
out center tags ${MAX_RESULTS * 2};`;
  const res = await fetch(OVERPASS_URL, { method: 'POST', body: new URLSearchParams({ data: query }) });
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
