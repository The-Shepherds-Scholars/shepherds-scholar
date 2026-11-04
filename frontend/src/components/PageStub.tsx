import type { ReactNode } from 'react';
import { ComingSoon } from './StatusTag';

// Placeholder for screens not built yet. Visitors see "Coming soon" and what the page will do.
// `wireframe` matches the numbered screen in the wireframes, which lists its components and API calls.
export default function PageStub({ title, wireframe, intro, coming, children }: {
  title: string; wireframe?: number; intro: ReactNode; coming?: ReactNode; children?: ReactNode;
}) {
  return (
    <main data-wireframe={wireframe}>
      <ComingSoon />
      <h1 style={{ marginTop: 12 }}>{title}</h1>
      <p className="lead">{intro}</p>
      {children}
      <aside className="status-note" role="note" style={{ marginTop: 32, maxWidth: '64ch' }}>
        <strong style={{ display: 'block' }}>This page is still being built.</strong>
        <span style={{ display: 'block', marginTop: 6 }}>
          {coming ?? 'It will appear here once its content has been gathered and checked.'} Until then, try the{' '}
          <a href="/map">then-and-now map</a> or <a href="/readings">today’s readings</a>.
        </span>
      </aside>
    </main>
  );
}
