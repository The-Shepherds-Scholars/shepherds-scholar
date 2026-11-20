import { useQuery } from '@tanstack/react-query';
import { staticGet } from './api';

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

export function useArtifacts() {
  return useQuery({
    queryKey: ['artifacts'],
    queryFn: () => staticGet<Artifact[]>('/artifacts'),
    staleTime: 60 * 60 * 1000,
  });
}
