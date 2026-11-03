import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronsLeftRight } from 'lucide-react';
import Skeleton from './Skeleton';
import { placeLabel, type Candidate, type PlaceSummary } from '../lib/places';

// The swipe map from wireframe 4 / design concept page 3: one Leaflet map with two tile layers.
// Today's map (OpenStreetMap) fills the map; the Roman-era map (DARE) sits on top and is clipped to
// the left of the divider. The divider's handle is a role="slider" that works with arrow keys.
//
// Tiles:
//   - DARE, Digital Atlas of the Roman Empire (Johan Åhlfeldt, University of Gothenburg). Zoom 0–11.
//     Credited on the map. License to confirm before launch (CC BY 4.0 per the most recent notice).
//   - OpenStreetMap. Usage policy: https://operations.osmfoundation.org/policies/tiles/

const DARE_URL = 'https://dh.gu.se/tiles/imperium/{z}/{x}/{y}.png';
const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  'Roman era: <a href="https://dh.gu.se/dare/">DARE</a>, Johan Åhlfeldt · ' +
  'Today: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MAX_ZOOM = 11; // the Roman-era tiles stop at zoom 11
const HOLY_LAND: L.LatLngBoundsExpression = [[31.3, 34.6], [33.2, 35.9]];

interface Props {
  places: PlaceSummary[];
  selected: string | null;
  candidates: Candidate[]; // candidates of the selected place, if any
  onSelect: (slug: string) => void;
}

export default function MapCompare({ places, selected, candidates, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const roman = useRef<L.TileLayer | null>(null);
  const placeLayer = useRef<L.LayerGroup | null>(null);
  const candidateLayer = useRef<L.LayerGroup | null>(null);
  const pctRef = useRef(0.6);
  const [pct, setPct] = useState(0.6);
  const [loaded, setLoaded] = useState(false);
  const dragging = useRef(false);

  // Keep the latest onSelect in a ref, so markers don't need rebuilding when the parent re-renders.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const markers = useRef(new Map<string, L.CircleMarker>());
  const selectedRef = useRef<string | null>(null);

  // Create the map once. Markers are drawn on a canvas, which keeps 1,300+ dots fast.
  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const m = L.map(mapEl.current, {
      maxZoom: MAX_ZOOM, minZoom: 4, scrollWheelZoom: false, zoomSnap: 0.5, zoomControl: false, preferCanvas: true,
    });
    // Zoom buttons bottom-left, so they don't cover the "Roman era" label.
    L.control.zoom({ position: 'bottomleft' }).addTo(m);
    m.fitBounds(HOLY_LAND);
    L.tileLayer(OSM_URL, { maxZoom: MAX_ZOOM, zIndex: 1, attribution: ATTRIBUTION }).addTo(m);
    const r = L.tileLayer(DARE_URL, { maxZoom: MAX_ZOOM, maxNativeZoom: 11, zIndex: 2 });
    r.once('load', () => setLoaded(true));
    r.addTo(m);
    roman.current = r;
    placeLayer.current = L.layerGroup().addTo(m);
    candidateLayer.current = L.layerGroup().addTo(m);
    m.on('move zoom resize', () => clip(m, r, pctRef.current));
    map.current = m;
    clip(m, r, pctRef.current);
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Re-clip when the divider moves.
  useEffect(() => {
    pctRef.current = pct;
    if (map.current && roman.current) clip(map.current, roman.current, pct);
  }, [pct]);

  // One dot per place with coordinates. Featured places are larger; clicking any dot selects it.
  useEffect(() => {
    const layer = placeLayer.current;
    if (!layer) return;
    layer.clearLayers();
    markers.current.clear();
    for (const p of places) {
      if (p.latitude === null || p.longitude === null) continue;
      const marker = L.circleMarker([p.latitude, p.longitude], markerStyle(p, p.slug === selectedRef.current))
        .bindTooltip(placeLabel(p))
        .on('click', () => onSelectRef.current(p.slug))
        .addTo(layer);
      markers.current.set(p.slug, marker);
    }
    const sel = selectedRef.current && markers.current.get(selectedRef.current);
    if (sel) sel.bringToFront();
  }, [places]);

  // Restyle only the previously selected and newly selected dots.
  useEffect(() => {
    const prev = selectedRef.current;
    selectedRef.current = selected;
    const bySlug = new Map(places.map((p) => [p.slug, p]));
    if (prev && prev !== selected) {
      const p = bySlug.get(prev);
      if (p) markers.current.get(prev)?.setStyle(markerStyle(p, false));
    }
    if (selected) {
      const p = bySlug.get(selected);
      const marker = markers.current.get(selected);
      if (p && marker) marker.setStyle(markerStyle(p, true)).bringToFront();
    }
  }, [selected, places]);

  // Candidate sites for a disputed place, drawn as stars.
  useEffect(() => {
    const layer = candidateLayer.current;
    if (!layer) return;
    layer.clearLayers();
    for (const c of candidates) {
      L.marker([c.latitude, c.longitude], { icon: STAR_ICON, keyboard: false })
        .bindTooltip(c.label)
        .addTo(layer);
    }
  }, [candidates]);

  // Focus the map on the selected place: fly to its dot, or fit its candidate sites.
  const candidateKey = candidates.map((c) => `${c.latitude},${c.longitude}`).join('|');
  useEffect(() => {
    const m = map.current;
    if (!m || !selected) return;
    const p = places.find((x) => x.slug === selected);
    const points: L.LatLngTuple[] = candidates.map((c): L.LatLngTuple => [c.latitude, c.longitude]);
    if (p && p.latitude !== null && p.longitude !== null) points.push([p.latitude, p.longitude]);
    // Visitors who ask for reduced motion get an instant jump instead of a flight.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      if (reduce) m.fitBounds(bounds, { padding: [48, 48], maxZoom: 10 });
      else m.flyToBounds(bounds, { padding: [48, 48], maxZoom: 10, duration: 0.8 });
    } else if (points.length === 1) {
      if (reduce) m.setView(points[0], focusZoom(p?.place_type));
      else m.flyTo(points[0], focusZoom(p?.place_type), { duration: 0.8 });
    }
    // candidateKey stands in for candidates, whose array identity changes on every load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, candidateKey, places]);

  function pctFromClientX(clientX: number) {
    const rect = wrapRef.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPct(pctFromClientX(e.clientX));
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragging.current) setPct(pctFromClientX(e.clientX));
  }
  function onPointerUp() {
    dragging.current = false;
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 0.2 : 0.05;
    const next =
      e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? pct - step
      : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? pct + step
      : e.key === 'Home' ? 0
      : e.key === 'End' ? 1
      : null;
    if (next === null) return;
    e.preventDefault();
    setPct(Math.min(1, Math.max(0, next)));
  }

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative', isolation: 'isolate', borderRadius: 12, overflow: 'hidden',
        border: '1px solid var(--line)', height: 'clamp(380px, 60vh, 540px)', background: '#cdb58a',
      }}
    >
      <div ref={mapEl} role="region" aria-label="Map of the Holy Land, Roman era and today" style={{ position: 'absolute', inset: 0 }} />

      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 900 }} aria-hidden="true">
          <Skeleton height="100%" radius={0} delayMs={0} />
        </div>
      )}

      <span style={{ ...badge, left: 10, background: '#3b2a1e', color: '#f3e6cf' }}>Roman era</span>
      <span style={{ ...badge, right: 10, background: '#fff', color: '#1c1b22' }}>Today</span>

      {/* Divider line and handle. Only the handle takes pointer input, so the map still pans elsewhere. */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct * 100}%`, width: 3, marginLeft: -1.5, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)', zIndex: 950, pointerEvents: 'none' }}
      />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Compare the Roman-era map with today’s"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct * 100)}
        aria-valuetext={`${Math.round(pct * 100)}% Roman era`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        style={{
          position: 'absolute', top: '50%', left: `${pct * 100}%`, width: 44, height: 44, marginLeft: -22, marginTop: -22,
          borderRadius: '50%', background: '#fff', border: '1px solid rgba(0,0,0,0.2)', boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          display: 'grid', placeItems: 'center', cursor: 'ew-resize', zIndex: 960, touchAction: 'none', color: '#1c1b22',
        }}
      >
        <ChevronsLeftRight size={20} aria-hidden="true" />
      </div>
    </div>
  );
}

const badge = {
  position: 'absolute', top: 10, zIndex: 940, padding: '4px 10px', borderRadius: 6,
  fontFamily: 'var(--font-display)', fontSize: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.2)', pointerEvents: 'none',
} as const;

const STAR_ICON = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html:
    '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#fff" stroke="#6B1E3A" stroke-width="1.5"/>' +
    '<path d="M12 5.5l1.9 4 4.4.5-3.3 3 .9 4.3L12 15.2 8.1 17.3l.9-4.3-3.3-3 4.4-.5z" fill="#6B1E3A"/></svg>',
});

/** Featured places get large dots; the 1,300+ imported places get small ones. */
function markerStyle(p: PlaceSummary, selected: boolean): L.CircleMarkerOptions {
  const featured = p.featured_order !== null;
  return {
    radius: selected ? 10 : featured ? 7 : 4,
    color: '#fff',
    weight: selected ? 3 : featured ? 2 : 1,
    fillColor: selected ? '#A3282E' : '#6B1E3A',
    fillOpacity: featured || selected ? 1 : 0.85,
  };
}

/** How far to zoom in on a place: closer for towns and sites, wider for regions and rivers. */
function focusZoom(placeType: string | undefined): number {
  return placeType === 'region' ? 8 : placeType === 'body_of_water' || placeType === 'mountain' ? 9 : 10;
}

/** Clip the Roman-era layer to the part of the map left of the divider. */
function clip(m: L.Map, layer: L.TileLayer, pct: number) {
  const container = layer.getContainer();
  if (!container) return;
  const nw = m.containerPointToLayerPoint([0, 0]);
  const se = m.containerPointToLayerPoint(m.getSize());
  const x = nw.x + (se.x - nw.x) * pct;
  container.style.clip = `rect(${nw.y}px, ${x}px, ${se.y}px, ${nw.x}px)`;
}
