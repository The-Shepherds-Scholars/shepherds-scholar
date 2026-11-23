import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import GlossaryText from './GlossaryText';
import ScholarDefinition from './ScholarDefinition';
import Skeleton from './Skeleton';
import { BeingChecked } from './StatusTag';
import { ARTIFACT_TYPE, AUTHENTICITY, EVIDENCE_ROLE, type Artifact } from '../lib/artifacts';

// One archaeological find, opened from the map. Everything shown comes from the artifact's own
// fields; any field that is empty is left out, so hand-picked and Wikidata-imported artifacts use
// the same panel with no per-artifact code.
//
// Rules this panel keeps:
//   - A photo is shown only with its license and a link to its source, as the license requires.
//   - Draft descriptions show "Being checked"; unreviewed imports say no one has checked them yet.
//   - Authenticity is always shown, with its glossary definition, so a debated find is never
//     mistaken for evidence.

interface Props {
  slug: string;
  artifacts: Artifact[];
  pending: boolean;
  onSelect: (slug: string) => void;
  onSelectPlace: (slug: string) => void;
}

export default function ArtifactPanel({ slug, artifacts, pending, onSelect, onSelectPlace }: Props) {
  const a = artifacts.find((x) => x.slug === slug);
  // Other finds from the same place in the Bible, or for a find with no place, from the same map
  // point, so a shared dot or diamond never hides one.
  const sameSpot = useMemo(() => {
    if (!a) return [];
    if (a.place_slug) return artifacts.filter((x) => x.slug !== a.slug && x.place_slug === a.place_slug);
    if (a.latitude === null) return [];
    return artifacts.filter((x) => x.slug !== a.slug && !x.place_slug && x.latitude === a.latitude && x.longitude === a.longitude);
  }, [a, artifacts]);

  if (pending) {
    return (
      <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        <Skeleton width="50%" height={30} />
        <Skeleton height={80} />
      </div>
    );
  }
  if (!a) return <p style={{ marginTop: 20 }}>This find couldn’t be found. It may have been removed.</p>;

  const type = ARTIFACT_TYPE[a.artifact_type];
  const auth = AUTHENTICITY[a.authenticity];
  const hasPhoto = a.image_url && a.image_license && a.image_source_url;
  const wikidataUrl = a.wikidata_id ? `https://www.wikidata.org/wiki/${a.wikidata_id}` : null;

  return (
    <article style={{ marginTop: 20 }}>
      <p className="small-note" style={{ margin: 0 }}>Archaeological find</p>
      <h2 style={{ margin: '2px 0 0', fontSize: 30 }}>{a.name}</h2>

      {hasPhoto && (
        <figure style={{ margin: '14px 0 0' }}>
          <img
            src={a.image_url!}
            alt={a.name}
            loading="lazy"
            style={{ display: 'block', width: '100%', maxHeight: 320, objectFit: 'contain', background: '#f3efe8', borderRadius: 8 }}
          />
          <figcaption className="small-note" style={{ marginTop: 6 }}>
            Photo{a.image_credit ? `: ${a.image_credit}` : ''} · {a.image_license} ·{' '}
            <a href={a.image_source_url!} target="_blank" rel="noreferrer">source</a>
          </figcaption>
        </figure>
      )}

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 20px', margin: '14px 0 0' }}>
        <dt className="muted">Type</dt>
        <dd style={{ margin: 0 }}><ScholarDefinition term={type.term}>{type.label}</ScholarDefinition></dd>
        {a.date_label && (
          <>
            <dt className="muted">Date</dt>
            <dd style={{ margin: 0 }}>{a.date_label}</dd>
          </>
        )}
        <dt className="muted">Found at</dt>
        <dd style={{ margin: 0 }}>
          {a.place_slug && a.place_name ? (
            <button type="button" onClick={() => onSelectPlace(a.place_slug!)} style={linkButton}>{a.place_name}</button>
          ) : a.latitude !== null ? 'See the map' : 'Not known'}
          {a.year_discovered !== null && <span className="muted"> (found {a.year_discovered})</span>}
        </dd>
        {a.museum && (
          <>
            <dt className="muted">Held by</dt>
            <dd style={{ margin: 0 }}>
              {a.museum_url ? <a href={a.museum_url} target="_blank" rel="noreferrer">{a.museum}</a> : a.museum}
            </dd>
          </>
        )}
        <dt className="muted">Genuine?</dt>
        <dd style={{ margin: 0 }}><ScholarDefinition term={auth.term}>{auth.label}</ScholarDefinition></dd>
      </dl>

      {a.authenticity_note && (
        <p style={{ margin: '12px 0 0', fontSize: 16 }}><GlossaryText text={a.authenticity_note} /></p>
      )}

      {a.significance && (
        <section style={{ marginTop: 18 }}>
          <h3 style={subhead}>What it shows</h3>
          <p style={{ margin: 0 }}><GlossaryText text={a.significance} /></p>
        </section>
      )}

      {a.description && (
        <section style={{ marginTop: 18 }}>
          <h3 style={subhead}>About it</h3>
          <p style={{ margin: 0 }}><GlossaryText text={a.description} /></p>
        </section>
      )}

      {a.claims.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <h3 style={subhead}>On this site</h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {a.claims.map((c) => (
              <li key={`${c.event_slug}:${c.statement}`}>
                {EVIDENCE_ROLE[c.evidence_role]}: “{c.statement}” in{' '}
                <Link to={`/events/${c.event_slug}`}>{c.event_title}</Link>
                {c.annotation && <span className="small-note" style={{ display: 'block' }}>{c.annotation}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sameSpot.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <h3 style={subhead}>{a.place_name ? `Also found at ${a.place_name}` : 'Also found at this spot'}</h3>
          <FindList finds={sameSpot} selected={null} onSelect={onSelect} />
        </section>
      )}

      <div className="small-note" style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'grid', gap: 6 }}>
        {a.notes_status === 'draft' && (a.description || a.significance) && (
          <span>
            <BeingChecked />{' '}
            {a.data_source === 'curated'
              ? 'Draft description, drafted with AI help and still being checked against sources.'
              : 'Draft description, still being checked against sources.'}
          </span>
        )}
        {a.authenticity === 'unreviewed' && (
          <span>
            <BeingChecked /> Added automatically from Wikidata. No one on this site has
            checked it yet, so it isn’t used as evidence for anything.
          </span>
        )}
        {(a.source_url || wikidataUrl) && (
          <span>
            Sources:{' '}
            {a.source_url && <a href={a.source_url} target="_blank" rel="noreferrer">reference</a>}
            {a.source_url && wikidataUrl && ' · '}
            {wikidataUrl && (
              <>
                <a href={wikidataUrl} target="_blank" rel="noreferrer">Wikidata</a> (
                <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a>)
              </>
            )}
          </span>
        )}
      </div>
    </article>
  );
}

/** A list of finds as buttons, each with its type, date, and authenticity at a glance. */
export function FindList({ finds, selected, onSelect }: { finds: Artifact[]; selected: string | null; onSelect: (slug: string) => void }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
      {finds.map((a) => (
        <li key={a.slug} style={{ borderLeft: '3px solid #b08a3e', paddingLeft: 12 }}>
          <button
            type="button"
            aria-pressed={a.slug === selected}
            onClick={() => onSelect(a.slug)}
            style={{ ...linkButton, fontWeight: a.slug === selected ? 700 : 500 }}
          >
            {a.name}
          </button>
          <span className="small-note" style={{ display: 'block' }}>
            {ARTIFACT_TYPE[a.artifact_type].label}
            {a.date_label ? ` · ${a.date_label}` : ''} · {AUTHENTICITY[a.authenticity].label}
          </span>
        </li>
      ))}
    </ul>
  );
}

const subhead = { margin: '0 0 8px', fontSize: 16, fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--muted)' } as const;
const linkButton = {
  font: 'inherit', padding: 0, background: 'none', border: 0, cursor: 'pointer', textAlign: 'left',
  color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3,
} as const;
