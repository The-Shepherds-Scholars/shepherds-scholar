import { Link, useSearchParams } from 'react-router-dom';
import GlossaryText from '../components/GlossaryText';
import ScholarDefinition from '../components/ScholarDefinition';
import Skeleton from '../components/Skeleton';
import { ComingSoon } from '../components/StatusTag';
import { addDays, formatLongDate, isISODate, localISODate, useReadings } from '../lib/readings';

// Wireframe 5. Mass readings for one date, as references with a link to the full text at the USCCB.
// The date lives in ?date= so a day can be shared. Previous and next are only enabled for dates
// the daily job has stored.
export default function Readings() {
  const [params, setParams] = useSearchParams();
  const today = localISODate();
  const date = isISODate(params.get('date')) ? params.get('date')! : today;
  const prev = addDays(date, -1);
  const next = addDays(date, 1);

  const day = useReadings(date);
  const prevDay = useReadings(prev);
  const nextDay = useReadings(next);

  const go = (target: string) => setParams(target === today ? {} : { date: target }, { replace: false });

  return (
    <main style={{ maxWidth: 820 }}>
      <h1>Daily readings</h1>
      <p className="lead">
        The day’s <ScholarDefinition term="mass">Mass</ScholarDefinition> readings, with a link to read them in full at
        the <ScholarDefinition term="usccb" />.
      </p>

      <nav aria-label="Choose a day" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
        <DayButton label="‹ Previous day" onClick={() => go(prev)} enabled={!!prevDay.data?.available} />
        <DayButton label="Today" onClick={() => go(today)} enabled={date !== today} />
        <DayButton label="Next day ›" onClick={() => go(next)} enabled={!!nextDay.data?.available} />
      </nav>

      <section className="card" aria-busy={day.isPending} aria-live="polite" style={{ marginTop: 24 }}>
        <p className="muted" style={{ margin: 0 }}>
          {date === today ? 'Today, ' : ''}
          {formatLongDate(date)}
        </p>

        {day.isPending && (
          <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
            <Skeleton width="65%" height={26} />
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={52} />)}
          </div>
        )}

        {day.isError && (
          <p>
            The readings couldn’t be loaded right now. The server may be waking up, so try again in a
            minute.
          </p>
        )}

        {day.data && !day.data.available && (
          <p>The readings for this day haven’t been loaded yet.</p>
        )}

        {day.data?.masses.map((mass) => (
          <div key={mass.mass_type} style={{ marginTop: 10 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 28 }}><GlossaryText text={mass.title} /></h2>
            {day.data.masses.length > 1 && (
              <p className="muted" style={{ margin: '-6px 0 12px' }}>{massLabel(mass.mass_type)}</p>
            )}
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {mass.readings.map((r) => (
                <li
                  key={r.section + r.reference}
                  style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px' }}
                >
                  <span className="muted" style={{ display: 'block', fontSize: 15 }}><GlossaryText text={r.section} /></span>
                  <strong style={{ fontWeight: 500 }}>{r.reference}</strong>
                </li>
              ))}
            </ol>
          </div>
        ))}

        {day.data && (
          <p style={{ margin: '20px 0 0' }}>
            <a className="button" href={day.data.masses[0]?.source_url ?? day.data.source_url}>
              Read the full readings at the USCCB
            </a>
          </p>
        )}
      </section>

      <p className="muted" style={{ fontSize: 15, marginTop: 20 }}>
        The <ScholarDefinition term="lectionary">lectionary</ScholarDefinition> text belongs to the USCCB, so only
        the references are shown here. <ComingSoon /> Each reading will open in the{' '}
        <ScholarDefinition term="publicDomain">public-domain</ScholarDefinition>{' '}
        <ScholarDefinition term="douayRheims" />. Until then, browse the{' '}
        <Link to="/timeline">timeline</Link>.
      </p>
    </main>
  );
}

function DayButton({ label, onClick, enabled }: { label: string; onClick: () => void; enabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      style={{
        minHeight: 44, padding: '0 16px', borderRadius: 999, font: 'inherit',
        border: '1px solid #8c8580', background: enabled ? 'var(--surface)' : 'transparent',
        color: enabled ? 'var(--ink)' : 'var(--muted)', cursor: enabled ? 'pointer' : 'not-allowed',
        opacity: enabled ? 1 : 0.6,
      }}
    >
      {label}
    </button>
  );
}

function massLabel(type: string): string {
  if (type === 'default') return 'Mass of the day';
  return type.replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
