import type { ReactNode } from 'react';

// Two labels used across the site, so visitors always know what is unfinished or unverified.
//   <ComingSoon />            a feature or section that isn't built yet
//   <BeingChecked />          content that exists but hasn't been checked against sources
//   <ComingSoonNote>…</ComingSoonNote>  a boxed note explaining what's coming

export function ComingSoon({ label = 'Coming soon' }: { label?: string }) {
  return <span className="status-tag status-tag--soon">{label}</span>;
}

export function BeingChecked({ label = 'Being checked' }: { label?: string }) {
  return <span className="status-tag status-tag--check">{label}</span>;
}

export function ComingSoonNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="status-note" role="note">
      <ComingSoon />
      <strong style={{ display: 'block', marginTop: 8 }}>{title}</strong>
      <span style={{ display: 'block', marginTop: 4 }}>{children}</span>
    </aside>
  );
}

export function BeingCheckedNote({ children }: { children: ReactNode }) {
  return (
    <aside className="status-note status-note--check" role="note">
      <BeingChecked />
      <span style={{ display: 'block', marginTop: 8 }}>{children}</span>
    </aside>
  );
}
