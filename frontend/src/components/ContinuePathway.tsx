import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { latestUnfinishedPathway, type PathwayProgress } from '../lib/progress';

// Wireframe 1, callout 4. Hidden until the visitor has started a guided pathway.
export default function ContinuePathway() {
  const [progress, setProgress] = useState<PathwayProgress | null>(null);
  useEffect(() => setProgress(latestUnfinishedPathway()), []);
  if (!progress) return null;

  const nextStep = firstUnfinished(progress);
  return (
    <section className="card" style={{ marginTop: 24, borderLeft: '6px solid var(--accent)' }}>
      <p className="muted" style={{ margin: 0 }}>Continue your pathway</p>
      <h2 style={{ margin: '4px 0 6px', fontSize: 24 }}>{progress.title}</h2>
      <p style={{ margin: '0 0 14px' }}>
        Step {nextStep} of {progress.totalSteps}
      </p>
      <Link className="button" to={`/pathways/${progress.slug}`}>Continue to step {nextStep}</Link>
    </section>
  );
}

function firstUnfinished(p: PathwayProgress): number {
  for (let step = 1; step <= p.totalSteps; step++) if (!p.completedSteps.includes(step)) return step;
  return p.totalSteps;
}
