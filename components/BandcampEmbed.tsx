'use client';

// Silhouettes (I, II & III) – Floating Points, Elaenia (10 Year Anniversary)
const BANDCAMP_EMBED_URL =
  'https://bandcamp.com/EmbeddedPlayer/album=3566510743/size=small/bgcol=ffffff/linkcol=333333/artwork=none/track=1894884423/transparent=true/';

const EMBED_WIDTH = 300;
const EMBED_HEIGHT = 42;
const CONTAINER1_SIZE = 38;

const SONG_TITLE = 'Silhouettes (I, II & III). Floating Points.';
const SONG_URL = 'https://floatingpoints.bandcamp.com/track/silhouettes-i-ii-iii';

export default function BandcampEmbed() {
  return (
    <div
      className="w-full flex items-center border border-gray-100 flex-none"
      style={{
        height: 44,
        minHeight: 44,
        maxHeight: 44,
        overflow: 'hidden',
      }}
    >
      {/* playButton: 38×38, widget cut 2px left, 260px right, 2px top & bottom */}
      <div
        style={{
          width: CONTAINER1_SIZE,
          height: CONTAINER1_SIZE,
          minWidth: CONTAINER1_SIZE,
          maxWidth: CONTAINER1_SIZE,
          minHeight: CONTAINER1_SIZE,
          maxHeight: CONTAINER1_SIZE,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <iframe
          src={BANDCAMP_EMBED_URL}
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
      </div>

      {/* vertical line */}
      <div
        className="flex-shrink-0 border-l border-gray-100"
        style={{ height: 44, minHeight: 44, maxHeight: 44 }}
      />

      {/* songTitleButton: fixed height on all screens */}
      <a
        href={SONG_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="no-scrollbar flex-1 min-w-0 overflow-x-auto pl-2 flex items-center cursor-pointer hover:opacity-80 transition-opacity flex-none"
        style={{ height: 44, minHeight: 44, maxHeight: 44 }}
      >
        <p className="text-[9px] whitespace-nowrap">
          {SONG_TITLE}
        </p>
      </a>
    </div>
  );
}
