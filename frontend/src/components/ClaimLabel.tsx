// The six claim types from the database (claims.claim_type). Every statement on the site carries one,
// so readers always know whether it comes from faith or from historical study.
// Styled as in the design concept: faith labels in navy, history labels in crimson, "Debated" dashed.
// Used on the Home page now, and by ClaimRow on event pages (wireframe 3) later.
// Each chip is a glossary term, so hovering or tapping it explains the label.
import ScholarDefinition from './ScholarDefinition';
import type { GlossaryTerm } from '../data/glossary';

export type ClaimType =
  | 'scripture'
  | 'church_teaching'
  | 'tradition'
  | 'historical_consensus'
  | 'scholarly_hypothesis'
  | 'disputed';

// `meaning` is draft wording for tooltips on event pages; review before launch.
export const CLAIM_TYPES: Record<ClaimType, { label: string; group: 'faith' | 'history'; meaning: string }> = {
  scripture: { label: 'Scripture', group: 'faith', meaning: 'What the Bible says, with the passage cited.' },
  church_teaching: { label: 'Church teaching', group: 'faith', meaning: 'What the Catholic Church teaches, citing the Catechism or a Church document.' },
  tradition: { label: 'Tradition', group: 'faith', meaning: 'Handed down in the Church over centuries, such as where an event took place.' },
  historical_consensus: { label: 'Historical consensus', group: 'history', meaning: 'What most historians agree on, based on the surviving evidence.' },
  scholarly_hypothesis: { label: 'Scholarly hypothesis', group: 'history', meaning: 'A reasoned idea some scholars hold, not settled.' },
  // Stored as "disputed" in the database; shown as "Debated", as in the design concept.
  disputed: { label: 'Debated', group: 'history', meaning: 'Experts disagree, and the evidence points more than one way.' },
};

const GLOSSARY_KEY: Record<ClaimType, GlossaryTerm> = {
  scripture: 'claimScripture',
  church_teaching: 'claimChurchTeaching',
  tradition: 'claimTradition',
  historical_consensus: 'claimHistoricalConsensus',
  scholarly_hypothesis: 'claimScholarlyHypothesis',
  disputed: 'claimDebated',
};

/** One claim label chip; hover or tap it for what the label means. */
export function ClaimLabel({ type }: { type: ClaimType }) {
  const t = CLAIM_TYPES[type];
  const variant = type === 'disputed' ? 'chip--debated' : t.group === 'faith' ? 'chip--faith' : 'chip--history';
  return (
    <span className={`chip ${variant}`}>
      <ScholarDefinition term={GLOSSARY_KEY[type]}>{t.label}</ScholarDefinition>
    </span>
  );
}

/** All six labels in a row: "The labels you will see". */
export function ClaimLabelRow() {
  return (
    <div className="chips">
      {(Object.keys(CLAIM_TYPES) as ClaimType[]).map((k) => (
        <ClaimLabel key={k} type={k} />
      ))}
    </div>
  );
}
