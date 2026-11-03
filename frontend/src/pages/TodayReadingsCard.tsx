import { Link } from 'react-router-dom';
import GlossaryText from '../components/GlossaryText';
import Skeleton from '../components/Skeleton';
import { localISODate, useReadings } from '../lib/readings';

// Wireframe 1, callout 3. The pattern every data-backed card follows:
// TanStack Query fetches, its pending state shows a skeleton, errors fall back gracefully.
// Asks for the visitor's own date, not the server's, so US evenings don't jump to tomorrow.
export default function TodayReadingsCard() {
  const { data, isPending, isError } = useReadings(localISODate());

  return (
    <div className="card" aria-busy={isPending}>
      <h2 style={{ margin: 0, fontSize: 26 }}>Today’s readings</h2>
      {isPending && (
        <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          <Skeleton width="55%" height={20} />
          <Skeleton width="70%" />
          <Skeleton width="62%" />
        </div>
      )}
      {isError && (
        <p className="muted">
          Today’s readings couldn’t be loaded. The server may be waking up, so try again in a minute, or{' '}
          <a href="https://bible.usccb.org/daily-bible-reading">read them at the USCCB</a>.
        </p>
      )}
      {data && !data.available && (
        <p>Not loaded yet today. <a href={data.source_url}>Read them at the USCCB</a>.</p>
      )}
      {data?.available && (
        <>
          <p style={{ margin: '8px 0 0', fontWeight: 500 }}><GlossaryText text={data.masses[0].title} /></p>
          <ul>
            {data.masses[0].readings.map((r) => (
              <li key={r.section + r.reference}><GlossaryText text={r.section} />: {r.reference}</li>
            ))}
          </ul>
          <Link to="/readings">All of today’s readings</Link>
        </>
      )}
    </div>
  );
}
