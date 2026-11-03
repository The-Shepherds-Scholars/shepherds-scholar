import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import { apiGet } from '../lib/api';

// Wireframe 1, callout 3. The pattern every data-backed card follows:
// TanStack Query fetches, its pending state shows a skeleton, errors fall back gracefully.
interface DayReadings {
  date: string;
  available: boolean;
  source_url: string;
  masses: Array<{ title: string; readings: Array<{ section: string; reference: string }> }>;
}

export default function TodayReadingsCard() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['readings', 'today'],
    queryFn: () => apiGet<DayReadings>('/readings/today'),
    staleTime: 60 * 60 * 1000, // readings change once a day
  });

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
      {isError && <p className="muted">Today’s readings couldn’t be loaded. Is the API running?</p>}
      {data && !data.available && (
        <p>Not loaded yet today. <a href={data.source_url}>Read them at the USCCB</a>.</p>
      )}
      {data?.available && (
        <>
          <p style={{ margin: '8px 0 0', fontWeight: 500 }}>{data.masses[0].title}</p>
          <ul>
            {data.masses[0].readings.map((r) => (
              <li key={r.section + r.reference}>{r.section}: {r.reference}</li>
            ))}
          </ul>
          <Link to="/readings">All of today’s readings</Link>
        </>
      )}
    </div>
  );
}
