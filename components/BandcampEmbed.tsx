'use client';

const EMBED_WIDTH = 300;
const EMBED_HEIGHT = 40;
const WIDGET_HEIGHT = 40;
const PLAY_BUTTON_SIZE = 38; // play button 38x38

type BandcampEmbedProps = {
  albumId: string | null | undefined;
  trackId: string | null | undefined;
  songUrl: string | null | undefined;
  songTitle: string | null | undefined;
  songArtist: string | null | undefined;
};

function buildBandcampEmbedUrl(albumId: string, trackId: string) {
  return `https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=small/bgcol=ffffff/linkcol=333333/artwork=none/track=${trackId}/transparent=true/`;
}

export default function BandcampEmbed({
  albumId,
  trackId,
  songUrl,
  songTitle,
  songArtist,
}: BandcampEmbedProps) {
  const hasIds = !!albumId && !!trackId;
  const href = songUrl || undefined;

  return (
    <div
      className="w-full flex items-center border border-gray-100 flex-none"
      style={{
        height: WIDGET_HEIGHT,
        minHeight: WIDGET_HEIGHT,
        maxHeight: WIDGET_HEIGHT,
        overflow: 'hidden',
      }}
    >
      {/* Play button (cropped Bandcamp iframe) */}
      <div
        style={{
          width: PLAY_BUTTON_SIZE,
          height: PLAY_BUTTON_SIZE,
          minWidth: PLAY_BUTTON_SIZE,
          maxWidth: PLAY_BUTTON_SIZE,
          minHeight: PLAY_BUTTON_SIZE,
          maxHeight: PLAY_BUTTON_SIZE,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {hasIds && (
          <iframe
            src={buildBandcampEmbedUrl(albumId!, trackId!)}
            style={{
              border: 0,
              width: EMBED_WIDTH,
              height: EMBED_HEIGHT,
              minHeight: EMBED_HEIGHT,
              maxHeight: EMBED_HEIGHT,
              position: 'relative',
              left: -2,
              top: -2,
            }}
            loading="lazy"
            allow="autoplay"
            title="Cone's song"
            seamless
          />
        )}
      </div>

      {/* Text + arrow, clickable to Bandcamp */}
      <a
        href={href}
        target={href ? '_blank' : undefined}
        rel={href ? 'noopener noreferrer' : undefined}
        className="flex-1 min-w-0 flex items-center pl-2 pr-2 cursor-pointer hover:opacity-80 transition-opacity"
        style={{ height: WIDGET_HEIGHT, minHeight: WIDGET_HEIGHT, maxHeight: WIDGET_HEIGHT }}
      >
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-1 min-w-0">
            <p className="flex-1 text-[9px] whitespace-nowrap overflow-hidden text-ellipsis">
              {songTitle || 'Cone song'}
            </p>
            <div className="flex-shrink-0 flex items-center justify-center w-4 h-4">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_156_3)">
                  <path
                    d="M2.49998 2.5V3.33333H6.07915L2.08331 7.32917L2.67081 7.91667L6.66665 3.92083V7.5H7.49998V2.5H2.49998Z"
                    fill="#444444"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_156_3">
                    <rect width="10" height="10" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          <p className="text-[9px] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
            {songArtist || ''}
          </p>
        </div>
      </a>
    </div>
  );
}
