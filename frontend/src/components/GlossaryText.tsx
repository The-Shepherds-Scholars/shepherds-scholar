import type { ReactNode } from 'react';
import ScholarDefinition from './ScholarDefinition';
import type { GlossaryTerm } from '../data/glossary';

// Adds glossary definitions to text that comes from the API, such as a liturgical day title
// ("Memorial of Saint Charles Borromeo"), a reading's section ("Responsorial Psalm"), or a map note.
// Static page copy should use <ScholarDefinition> directly; this is for text we don't write.
// Longer phrases come first so "Responsorial Psalm" wins over "Psalm".
const PHRASES: Array<[string, GlossaryTerm]> = [
  ['Ordinary Time', 'ordinaryTime'],
  ['Responsorial Psalm', 'psalm'],
  ['Solemnity', 'solemnity'],
  ['Memorial', 'memorial'],
  ['Feast', 'feast'],
  ['Advent', 'advent'],
  ['Lent', 'lent'],
  ['Alleluia', 'alleluia'],
  ['Gospel', 'gospel'],
  ['Psalm', 'psalm'],
  ['Mass', 'mass'],
  ['stadia', 'stadia'],
  ['Crusader', 'crusades'],
];

const PATTERN = new RegExp(`\\b(${PHRASES.map(([p]) => p).join('|')})\\b`, 'g');
const TERM_FOR = new Map(PHRASES);

/** Text with each known term marked once, keeping the original wording and capitalization. */
export default function GlossaryText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const used = new Set<GlossaryTerm>();
  let last = 0;
  for (const match of text.matchAll(PATTERN)) {
    const term = TERM_FOR.get(match[1])!;
    if (used.has(term)) continue;
    used.add(term);
    out.push(text.slice(last, match.index));
    out.push(
      <ScholarDefinition key={match.index} term={term}>
        {match[1]}
      </ScholarDefinition>,
    );
    last = match.index! + match[1].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
