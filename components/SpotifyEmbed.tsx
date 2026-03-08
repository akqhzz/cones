'use client';

interface SpotifyEmbedProps {
  trackId: string;
}

const EMBED_WIDTH = 300;
const EMBED_HEIGHT = 152;
const CUT_LEFT = 200;
const CUT_TOP = 100;

export default function SpotifyEmbed({ trackId }: SpotifyEmbedProps) {
  return (
    <div
      style={{
        overflow: 'hidden',
        width: EMBED_WIDTH - CUT_LEFT,
        height: EMBED_HEIGHT - CUT_TOP,
      }}
    >
      <iframe
        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
        width={EMBED_WIDTH}
        height={EMBED_HEIGHT}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{
          borderRadius: 12,
          position: 'relative',
          left: -CUT_LEFT,
          top: -CUT_TOP,
        }}
      />
    </div>
  );
}
