// Guided pathway progress, kept on the visitor's device (v1 has no accounts).
// One localStorage key per pathway: "ss:pathway:<slug>". The pathway page (wireframe 8) writes it;
// the Home page reads it to offer "Continue your pathway".

export interface PathwayProgress {
  slug: string;
  title: string;
  totalSteps: number;
  completedSteps: number[]; // step_order values the visitor has finished
  updatedAt: string; // ISO timestamp
}

const PREFIX = 'ss:pathway:';

export function savePathwayProgress(p: PathwayProgress): void {
  try {
    localStorage.setItem(PREFIX + p.slug, JSON.stringify(p));
  } catch {
    // Private mode or storage blocked: progress just isn't remembered.
  }
}

/** The most recently used pathway that isn't finished, or null. */
export function latestUnfinishedPathway(): PathwayProgress | null {
  try {
    const all: PathwayProgress[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const p = JSON.parse(localStorage.getItem(key) ?? 'null') as PathwayProgress | null;
      if (p && p.totalSteps > 0 && p.completedSteps.length < p.totalSteps) all.push(p);
    }
    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return all[0] ?? null;
  } catch {
    return null;
  }
}
