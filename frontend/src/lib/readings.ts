import { useQuery } from '@tanstack/react-query';
import { apiGet } from './api';

// Daily Mass readings: references only (the lectionary text is copyrighted), plus a USCCB link.
export interface ReadingRef {
  section: string; // "First Reading", "Responsorial Psalm", "Gospel", ...
  reference: string; // "Philippians 2:5-11"
}
export interface Mass {
  mass_type: string; // "default", or e.g. "vigil" on days with more than one Mass
  title: string; // the liturgical day, e.g. "Tuesday of the Thirty-first Week in Ordinary Time"
  source_url: string;
  readings: ReadingRef[];
}
export interface DayReadings {
  date: string; // YYYY-MM-DD
  available: boolean;
  masses: Mass[];
  source_url: string; // always present, so there is always a USCCB link
}

/** The visitor's own calendar date as YYYY-MM-DD (not UTC, so evenings in the US stay on today). */
export function localISODate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Add whole days to a YYYY-MM-DD date. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return localISODate(new Date(y, m - 1, d + days));
}

/** "Tuesday, November 3, 2026" */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export function isISODate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function useReadings(date: string) {
  return useQuery({
    queryKey: ['readings', date],
    queryFn: () => apiGet<DayReadings>(`/readings/${date}`),
    staleTime: 60 * 60 * 1000, // readings change once a day
  });
}
