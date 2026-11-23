import { useQuery } from '@tanstack/react-query';
import { staticGet } from './api';
import type { GlossaryTerm } from '../data/glossary';

// Artifacts for the map's artifacts layer: /data/artifacts.json (exported weekly), else GET /api/v1/artifacts.
// An artifact shows the world of the Bible was real. It never proves a matter of faith, so each one
// says what it shows (significance) and how sure scholars are that it is genuine (authenticity).
export type Authenticity = 'accepted' | 'debated' | 'forgery' | 'unreviewed';
export type ArtifactType = 'inscription' | 'coin' | 'ossuary' | 'building' | 'manuscript' | 'object';
export type EvidenceRole = 'states' | 'supports' | 'contextualizes' | 'challenges' | 'discusses';

export interface ArtifactClaim {
  statement: string;
  claim_type: string;
  evidence_role: EvidenceRole; // only an 'accepted' artifact can state or support a claim
  annotation: string | null;
  event_slug: string;
  event_title: string;
}

export interface Artifact {
  slug: string;
  name: string;
  artifact_type: ArtifactType;
  description: string | null;
  significance: string | null; // what the find shows, e.g. "Pontius Pilate was a real Roman governor"
  notes_status: 'draft' | 'checked'; // draft: show "Being checked"
  authenticity: Authenticity; // unreviewed: imported, not yet checked by a person
  authenticity_note: string | null;
  year_discovered: number | null;
  place_slug: string | null;
  place_name: string | null;
  latitude: number | null; // find spot, else the place's location; null when unknown
  longitude: number | null;
  earliest_year: number | null; // astronomical years: 1 BCE = 0
  latest_year: number | null;
  date_label: string | null; // "26–36 CE"
  museum: string | null;
  museum_url: string | null;
  image_url: string | null; // always comes with image_license and image_source_url
  image_license: string | null;
  image_credit: string | null;
  image_source_url: string | null; // the photo's Wikimedia Commons page, linked as the credit
  data_source: 'curated' | 'wikidata';
  source_url: string | null;
  wikidata_id: string | null;
  claims: ArtifactClaim[];
}

// Labels are keyed by the database's allowed values (the CHECK constraints in the artifacts
// migration), never by a particular artifact, so a new artifact needs no code change.

/** Display label and glossary entry for each artifact type. */
export const ARTIFACT_TYPE: Record<ArtifactType, { label: string; term: GlossaryTerm }> = {
  inscription: { label: 'Inscription', term: 'artInscription' },
  coin: { label: 'Coin', term: 'artCoin' },
  ossuary: { label: 'Ossuary', term: 'artOssuary' },
  building: { label: 'Building', term: 'artBuilding' },
  manuscript: { label: 'Manuscript', term: 'artManuscript' },
  object: { label: 'Object', term: 'artObject' },
};

/** Display label and glossary entry for each authenticity value. */
export const AUTHENTICITY: Record<Authenticity, { label: string; term: GlossaryTerm }> = {
  accepted: { label: 'Accepted as genuine', term: 'authAccepted' },
  debated: { label: 'Debated', term: 'authDebated' },
  forgery: { label: 'Forgery', term: 'authForgery' },
  unreviewed: { label: 'Not yet reviewed', term: 'authUnreviewed' },
};

/** How an artifact bears on a statement, in words a visitor can follow. */
export const EVIDENCE_ROLE: Record<EvidenceRole, string> = {
  states: 'States',
  supports: 'Supports',
  contextualizes: 'Gives background to',
  challenges: 'Challenges',
  discusses: 'Is discussed in',
};

/** True when the artifact has a point on the map (its find spot, or its place's location). */
export function onMap(a: Artifact): a is Artifact & { latitude: number; longitude: number } {
  return a.latitude !== null && a.longitude !== null;
}

/** How many artifacts belong to each place, by place slug. */
export function countByPlace(artifacts: Artifact[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const a of artifacts) if (a.place_slug) counts.set(a.place_slug, (counts.get(a.place_slug) ?? 0) + 1);
  return counts;
}

/**
 * Artifacts grouped by map point, so finds at the same spot (several at Jerusalem, say) share one
 * marker instead of hiding each other. Order within a group follows the API's order.
 */
export function groupBySpot(artifacts: Artifact[]): Array<{ key: string; latitude: number; longitude: number; items: Artifact[] }> {
  const groups = new Map<string, { key: string; latitude: number; longitude: number; items: Artifact[] }>();
  for (const a of artifacts) {
    if (!onMap(a)) continue;
    const key = `${a.latitude.toFixed(4)},${a.longitude.toFixed(4)}`; // about 10 m
    const g = groups.get(key);
    if (g) g.items.push(a);
    else groups.set(key, { key, latitude: a.latitude, longitude: a.longitude, items: [a] });
  }
  return [...groups.values()];
}

export function useArtifacts() {
  return useQuery({
    queryKey: ['artifacts'],
    queryFn: () => staticGet<Artifact[]>('/artifacts'),
    staleTime: 60 * 60 * 1000,
  });
}
