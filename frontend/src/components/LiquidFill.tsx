import { useEffect, useMemo, useState } from 'react';

// The nav bar's color change, ported from the prototype: the new color sweeps across
// the bar while small bubbles melt into its leading edge through an SVG "goo" filter.
// Remount it (with a new `key`) on every route change to replay.

const BUBBLE_COUNT = 32;

function seededBubbles() {
  // A fixed seed, so the stream looks the same on every visit.
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: BUBBLE_COUNT }, () => ({
    size: 8 + Math.round(rnd() * 16),
    top: Math.round(rnd() * 96) + 2,
    durFactor: 0.98 + rnd() * 0.04,
    delay: Math.round(rnd() * 120),
    end: Math.round(rnd() * 16) - 8,
    start: 24 + Math.round(rnd() * 90),
  }));
}

export default function LiquidFill({ to, durationMs }: { to: string; durationMs: number }) {
  const [go, setGo] = useState(false);
  const bubbles = useMemo(seededBubbles, []);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ms = reduce ? 0 : durationMs;

  useEffect(() => {
    // Two frames, so the starting position paints before the transition begins.
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setGo(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, []);

  const ease = 'cubic-bezier(0.3, 0.2, 0.25, 1)';
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, filter: 'url(#liquid-goo)' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="liquid-goo" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: 'absolute', top: -24, bottom: -24, left: 0,
          width: go ? '100%' : '0%', background: to,
          transition: `width ${ms}ms ${ease}`,
        }}
      />
      {ms > 0 &&
        bubbles.map((b, i) => (
          <span
            key={i}
            style={{
              position: 'absolute', top: `${b.top}%`, width: b.size, height: b.size,
              borderRadius: '50%', background: to,
              left: go ? `calc(100% + ${b.end}px)` : `${b.start}px`,
              transform: `translateY(-50%) scale(${go ? 1.25 : 0.9})`,
              transition: `left ${Math.round(ms * b.durFactor)}ms ${ease} ${b.delay}ms, transform ${Math.round(ms * b.durFactor)}ms ease-in-out ${b.delay}ms`,
            }}
          />
        ))}
    </div>
  );
}
