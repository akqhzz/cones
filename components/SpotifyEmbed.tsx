'use client';

interface SpotifyEmbedProps {
  trackId: string;
  trackTitle?: string;
  artistName?: string;
}

const EMBED_WIDTH = 300;
const EMBED_HEIGHT = 152;
const CUT_LEFT = 246;
const CUT_TOP = 100;

const SONG_LINK_BASE = 'https://open.spotify.com/track';

function ArrowOutwardIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2.49967 2.5V3.33333H6.07884L2.08301 7.32917L2.67051 7.91667L6.66634 3.92083V7.5H7.49967V2.5H2.49967Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function SpotifyEmbed({
  trackId,
  trackTitle = 'Track Title',
  artistName = 'Track Artist',
}: SpotifyEmbedProps) {
  const songUrl = `${SONG_LINK_BASE}/${trackId}`;

  return (
    <div
      style={{
        width: 180,
        height: 52,
        backgroundColor: '#1f1f1f',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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
              borderRadius: 0,
              position: 'relative',
              left: -CUT_LEFT,
              top: -CUT_TOP,
            }}
          />
        </div>
      </div>

      <a
        href={songUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          paddingLeft: 0,
          paddingRight: 8,
          minWidth: 0,
          textDecoration: 'none',
          color: 'inherit',
          cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {trackTitle}
          </div>
          <div
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.6)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {artistName}
          </div>
        </div>
        <span style={{ flexShrink: 0, color: '#fff', display: 'flex', lineHeight: 0 }}>
          <ArrowOutwardIcon />
        </span>
      </a>
    </div>
  );
}
