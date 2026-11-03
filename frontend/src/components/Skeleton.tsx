import { useEffect, useState, type CSSProperties } from 'react';
import './Skeleton.css';

// Shows only if loading lasts longer than `delayMs`, so fast pages never flash a skeleton.
export default function Skeleton({ width = '100%', height = 16, radius = 8, delayMs = 300, style }: {
  width?: number | string; height?: number | string; radius?: number; delayMs?: number; style?: CSSProperties;
}) {
  const [visible, setVisible] = useState(delayMs === 0);
  useEffect(() => {
    if (delayMs === 0) return;
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  if (!visible) return null;
  return <div className="skel" aria-hidden="true" style={{ width, height, borderRadius: radius, ...style }} />;
}
