import { useQuery } from '@tanstack/react-query';
import { apiGet } from './api';
import type { GlossaryTerm } from '../data/glossary';

// Places for the then-and-now map: GET /api/v1/places and /api/v1/places/:slug.
export type LocationConfidence = 'certain' | 'probable' | 'possible' | 'traditional' | 'unknown';

export interface PlaceSummary {
  slug: string;
  name: string; // common English name, e.g. "Capernaum"
  ancient_name: string;
  modern_name: string | null;
  place_type: string;
  latitude: number | null;
  longitude: number | null;
  location_confidence: LocationConfidence;
  featured_order: number | null;
  candidate_count: number;
  data_source: 'curated' | 'openbible';
}

export interface Candidate {
  label: string;
  latitude: number;
  longitude: number;
  confidence: LocationConfidence;
  note: string | null;
}

export interface PlaceDetail extends PlaceSummary {
  notes: string | null;
  notes_status: 'draft' | 'checked';
  wikidata_id: string | null;
  source_url: string | null; // OpenBible.info page, for imported places
  candidates: Candidate[];
  passages: Array<{ id: string; reference: string }>;
  events: Array<{ slug: string; title: string }>;
}

/** Display label and glossary entry for each location confidence. */
export const CONFIDENCE: Record<LocationConfidence, { label: string; term: GlossaryTerm }> = {
  certain: { label: 'Certain', term: 'locCertain' },
  probable: { label: 'Probable', term: 'locProbable' },
  possible: { label: 'Possible', term: 'locPossible' },
  traditional: { label: 'Traditional', term: 'locTraditional' },
  unknown: { label: 'Uncertain', term: 'locUnknown' },
};

/** Every place: the hand-written featured ones first (in chip order), then the OpenBible.info import. */
export function usePlaces() {
  return useQuery({
    queryKey: ['places', 'all'],
    queryFn: () => apiGet<PlaceSummary[]>('/places'),
    staleTime: 60 * 60 * 1000,
  });
}

/** Name shown on screen. Places sharing a name are told apart by their modern site. */
export function placeLabel(p: Pick<PlaceSummary, 'name' | 'modern_name'>): string {
  return p.modern_name && p.modern_name !== p.name ? `${p.name} (${p.modern_name})` : p.name;
}

export function usePlace(slug: string | null) {
  return useQuery({
    queryKey: ['place', slug],
    queryFn: () => apiGet<PlaceDetail>(`/places/${slug}`),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000,
  });
}
