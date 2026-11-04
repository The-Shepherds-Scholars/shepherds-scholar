import { useState } from 'react';
import { Play } from 'lucide-react';

// A YouTube video that doesn't contact YouTube until the visitor presses play.
// Until then it's a plain card (the design concept's dark "Watch first" card). After the click it
// loads YouTube's privacy-enhanced player (youtube-nocookie.com), which doesn't set cookies until
// the video plays.
export default function VideoEmbed({ videoId, title, byline }: { videoId: string; title: string; byline: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#2b2419' }}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          data-track={`Play video: ${title}`}
          style={{
            position: 'absolute', inset: 0, width: '100%', border: 0, cursor: 'pointer', background: 'transparent',
            color: '#f5ecd9', display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 16, padding: 24,
            font: 'inherit', textAlign: 'center',
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', display: 'grid', placeItems: 'center' }}
          >
            <Play size={28} fill="#fff" color="#fff" style={{ marginLeft: 4 }} />
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 3vw, 28px)', maxWidth: '24ch', lineHeight: 1.2 }}>
            {title}
          </span>
          <span style={{ fontSize: 15, opacity: 0.85 }}>{byline}</span>
          <span className="visually-hidden">Play video</span>
        </button>
      )}
    </div>
  );
}
