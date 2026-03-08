'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import ConeProfile from './ConeProfile';
import type { Cone } from '@/lib/db';

const GAP = 10; // physical gap between cards (equal on all sides)

// ── Shuffle Icon SVG ─────────────────────────────────────────────────────────
function ShuffleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="4" y1="4" x2="21" y2="21" />
    </svg>
  );
}

// ── Filter Icon SVG ───────────────────────────────────────────────────────────
function FilterIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}

// ── Carousel ──────────────────────────────────────────────────────────────────
function Carousel({
  cones,
  currentIndex,
  onChange,
  onOpenProfile,
  filter,
  onUploadClick,
}: {
  cones: Cone[];
  currentIndex: number;
  onChange: (i: number) => void;
  onOpenProfile: (cone: Cone) => void;
  filter: 'all' | 'mine';
  onUploadClick: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Use fixed initial width so server and client render the same (avoids hydration mismatch).
  // ResizeObserver updates to real width after mount.
  const [containerWidth, setContainerWidth] = useState(375);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const wasDragging = useRef(false);

  // Wheel / trackpad
  const wheelAccumulator = useRef(0);
  const lastSnapTime = useRef(0);
  const wheelResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Base card size — responsive to container width
  const ITEM_W = useMemo(() => {
    if (containerWidth < 360) return 88;
    if (containerWidth < 480) return 108;
    if (containerWidth < 768) return 126;
    if (containerWidth < 1200) return 144;
    if (containerWidth < 1600) return 180;
    return 220;
  }, [containerWidth]);

  // Card size by distance from active index — center unchanged; all non-center cards same smaller size (squares)
  const getCardSize = useCallback(
    (i: number) => {
      const d = Math.abs(i - currentIndex);
      if (d === 0) return Math.round(ITEM_W * 1.38);
      return Math.round(ITEM_W * 0.62);
    },
    [currentIndex, ITEM_W]
  );

  // Translate so the active card is centered
  const translateX = useMemo(() => {
    let offset = 0;
    for (let j = 0; j < currentIndex; j++) {
      offset += getCardSize(j) + GAP;
    }
    return containerWidth / 2 - offset - getCardSize(currentIndex) / 2;
  }, [containerWidth, currentIndex, getCardSize]);

  // Use ResizeObserver so measurement fires whenever the container is available/resized
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContainerWidth(el.offsetWidth);
    });
    ro.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  // Smooth trackpad / wheel scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el || cones.length === 0) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = Date.now();
      const SNAP_COOLDOWN = 460;
      const THRESHOLD = 52;

      if (now - lastSnapTime.current < SNAP_COOLDOWN) return;

      const delta =
        Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

      wheelAccumulator.current += delta;

      if (wheelResetTimer.current) clearTimeout(wheelResetTimer.current);
      wheelResetTimer.current = setTimeout(() => {
        wheelAccumulator.current = 0;
      }, 180);

      if (Math.abs(wheelAccumulator.current) > THRESHOLD) {
        const dir = wheelAccumulator.current > 0 ? 1 : -1;
        const newIdx = Math.min(
          Math.max(currentIndex + dir, 0),
          cones.length - 1
        );
        wheelAccumulator.current = 0;
        if (newIdx !== currentIndex) {
          onChange(newIdx);
          lastSnapTime.current = now;
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (wheelResetTimer.current) clearTimeout(wheelResetTimer.current);
    };
  }, [currentIndex, cones.length, onChange]);

  const getOpacity = (i: number) => {
    const d = Math.abs(i - currentIndex);
    // Keep all cones visible in viewport: gentle fade, minimum 0.5
    if (d > 4) return 0.5;
    if (d > 2) return 0.75;
    return 1;
  };

  // Prevent browser back/forward gesture when swiping carousel horizontally (use native listener so preventDefault works)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || cones.length === 0) return;
    const handleTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = Math.abs(x - touchStartX.current);
      const dy = Math.abs(y - touchStartY.current);
      if (dx > dy && dx > 5) e.preventDefault();
    };
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [cones.length]);

  // Touch
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -40 && currentIndex < cones.length - 1) onChange(currentIndex + 1);
    else if (delta > 40 && currentIndex > 0) onChange(currentIndex - 1);
  };

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    wasDragging.current = false;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && Math.abs(e.clientX - dragStartX.current) > 5) {
      wasDragging.current = true;
    }
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (wasDragging.current) {
      const delta = e.clientX - dragStartX.current;
      if (delta < -40 && currentIndex < cones.length - 1) onChange(currentIndex + 1);
      else if (delta > 40 && currentIndex > 0) onChange(currentIndex - 1);
    }
  };

  // Container always renders with the ref so ResizeObserver can measure correctly.
  // Empty state is rendered inside rather than as an early return.
  const centerSize = Math.round(ITEM_W * 1.38);
  const containerH = centerSize + 20;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden select-none w-full touch-pan-y"
      style={{ height: `${containerH}px`, touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={cones.length > 0 ? onMouseDown : undefined}
      onMouseMove={cones.length > 0 ? onMouseMove : undefined}
      onMouseUp={cones.length > 0 ? onMouseUp : undefined}
      onMouseLeave={() => { isDragging.current = false; }}
    >
      {cones.length === 0 ? (
        filter === 'mine' ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[10px] uppercase text-black">
              <button
                type="button"
                onClick={onUploadClick}
                className="underline cursor-pointer"
              >
                UPLOAD
              </button>
              {' your first cone'}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[9px] uppercase text-gray-300">No cones yet</p>
          </div>
        )
      ) : (
        <div
          className="absolute inset-y-0 flex items-center cursor-grab active:cursor-grabbing"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: 'transform 0.36s cubic-bezier(0.4, 0, 0.2, 1)',
            gap: GAP,
            willChange: 'transform',
          }}
        >
          {cones.map((cone, i) => {
            const size = getCardSize(i);
            const opacity = getOpacity(i);
            const isActive = i === currentIndex;

            return (
              <div
                key={cone.id}
                className="flex-shrink-0 overflow-hidden bg-gray-50"
                style={{
                  width: size,
                  height: size,
                  transition:
                    'width 0.36s cubic-bezier(0.4, 0, 0.2, 1), height 0.36s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.36s',
                  opacity,
                  cursor: 'pointer',
                  zIndex: isActive ? 10 : 1,
                  position: 'relative',
                }}
                onClick={() => {
                  if (wasDragging.current) return;
                  if (isActive) {
                    onOpenProfile(cone);
                  } else {
                    onChange(i);
                  }
                }}
              >
                {cone.image_path && (
                  <img
                    src={cone.image_path}
                    alt={cone.description || 'Cone'}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Info Tab ──────────────────────────────────────────────────────────────────
function InfoTab() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-xs space-y-5">
        <p className="text-[9px] uppercase text-gray-400">About</p>
        <h1 className="text-[11px] font-medium uppercase">Cones</h1>
        <p className="text-[10px] leading-relaxed text-gray-600">
          A community archive of traffic cones. Photograph a cone, let AI
          divine its personality, and add it to the collective.
        </p>
        <div className="border-t border-gray-100 pt-5 space-y-2">
          <p className="text-[9px] text-gray-400">Every cone has a story.</p>
          <p className="text-[9px] text-gray-400">
            Every story deserves a song.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Filter Pills ──────────────────────────────────────────────────────────────
function FilterPills({
  filter,
  totalCount,
  mineCount,
  onFilter,
}: {
  filter: 'all' | 'mine';
  totalCount: number;
  mineCount: number;
  onFilter: (f: 'all' | 'mine') => void;
}) {
  return (
    <>
      <button
        onClick={() => onFilter('all')}
        className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full border transition-all cursor-pointer leading-none"
        style={
          filter === 'all'
            ? { background: 'transparent', color: '#111', borderColor: '#333' }
            : { background: '#f0f0f0', color: '#999', borderColor: 'transparent' }
        }
      >
        ALL
        <span className="opacity-60">({totalCount})</span>
      </button>
      <button
        onClick={() => onFilter('mine')}
        className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full border transition-all cursor-pointer leading-none"
        style={
          filter === 'mine'
            ? { background: 'transparent', color: '#111', borderColor: '#333' }
            : { background: '#f0f0f0', color: '#999', borderColor: 'transparent' }
        }
      >
        MINE
        <span className="opacity-60">({mineCount})</span>
      </button>
    </>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function ConesApp() {
  const [cones, setCones] = useState<Cone[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [mineCount, setMineCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [activeTab, setActiveTab] = useState<'cones' | 'info'>('cones');
  const [selectedCone, setSelectedCone] = useState<Cone | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analyzingCone, setAnalyzingCone] = useState<Cone | null>(null);
  const [sessionId, setSessionId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const undoStackRef = useRef<Cone[]>([]);
  const redoStackRef = useRef<Cone[]>([]);

  useEffect(() => {
    let sid = localStorage.getItem('cones_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('cones_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  const fetchCones = useCallback(async (f: 'all' | 'mine', sid: string): Promise<Cone[] | void> => {
    if (!sid) return;
    try {
      const res = await fetch(`/api/cones?filter=${f}&session_id=${sid}`);
      const data = await res.json();
      const list: Cone[] = (data.cones ?? []).sort(
        (a: Cone, b: Cone) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setCones(list);
      setTotalCount(data.total ?? 0);
      setMineCount(data.totalMine ?? 0);
      // Start at center cone (e.g. 8th of 16)
      setCurrentIndex(
        list.length > 0 ? Math.floor((list.length - 1) / 2) : 0
      );
      return list;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (sessionId) fetchCones(filter, sessionId);
  }, [sessionId, filter, fetchCones]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;
    e.target.value = '';
    setIsUploading(true);

    const tempCone: Cone = {
      id: 'temp',
      session_id: sessionId,
      image_path: URL.createObjectURL(file),
      description: null,
      location: null,
      about: null,
      openness: null,
      conscientiousness: null,
      extraversion: null,
      agreeableness: null,
      neuroticism: null,
      core_values: [],
      song_title: null,
      song_artist: null,
      spotify_track_id: null,
      is_impostor: 0,
      is_analyzed: 0,
      created_at: new Date().toISOString(),
      index: 1,
    };
    setAnalyzingCone(tempCone);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('session_id', sessionId);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.cone) {
        setAnalyzingCone(null);
        setSelectedCone(data.cone);
        const list = await fetchCones('mine', sessionId);
        if (list?.length) setCurrentIndex(list.length - 1);
        setFilter('mine');
      }
    } catch {
      setAnalyzingCone(null);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (cone: Cone) => {
    if (!sessionId) {
      setSelectedCone(null);
      fetchCones(filter, sessionId);
      return;
    }
    undoStackRef.current.push(cone);
    redoStackRef.current = [];
    const res = await fetch(`/api/cones/${cone.id}?session_id=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setSelectedCone(null);
      fetchCones(filter, sessionId);
    } else {
      undoStackRef.current.pop();
    }
  };

  const handleUndo = useCallback(async () => {
    const cone = undoStackRef.current.pop();
    if (!cone || !sessionId) return;
    try {
      const res = await fetch('/api/cones/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cone }),
      });
      if (res.ok) {
        redoStackRef.current.push(cone);
        fetchCones(filter, sessionId);
      } else {
        undoStackRef.current.push(cone);
      }
    } catch {
      undoStackRef.current.push(cone);
    }
  }, [sessionId, filter, fetchCones]);

  const handleRedo = useCallback(async () => {
    const cone = redoStackRef.current.pop();
    if (!cone || !sessionId) return;
    try {
      const res = await fetch(`/api/cones/${cone.id}?session_id=${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        undoStackRef.current.push(cone);
        fetchCones(filter, sessionId);
      } else {
        redoStackRef.current.push(cone);
      }
    } catch {
      redoStackRef.current.push(cone);
    }
  }, [sessionId, filter, fetchCones]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const handleShuffle = () => {
    if (cones.length === 0) return;
    let newIdx = currentIndex;
    while (newIdx === currentIndex && cones.length > 1) {
      newIdx = Math.floor(Math.random() * cones.length);
    }
    setCurrentIndex(newIdx);
  };

  const activeCone = cones[currentIndex];

  const formattedActiveDate = activeCone?.created_at
    ? (() => {
        const d = new Date(activeCone.created_at);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(2);
        return `${mm}/${dd}/${yy}`;
      })()
    : '';

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* ── Desktop top nav ── */}
      <header className="hidden md:flex items-center justify-between px-5 py-2.5">
        <nav className="flex items-center gap-4">
          {(['cones', 'info'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative text-[10px] uppercase pb-1 cursor-pointer"
              style={{ color: activeTab === tab ? '#000' : '#999' }}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-1 h-1 rounded-full bg-black" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <FilterPills filter={filter} totalCount={totalCount} mineCount={mineCount} onFilter={setFilter} />
          <button className="ml-1 text-gray-400 hover:text-black transition-colors p-1">
            <FilterIcon />
          </button>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-sm leading-none hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          +
        </button>
      </header>

      {/* ── Mobile top filter ── */}
      {activeTab === 'cones' && (
        <div className="md:hidden flex items-center gap-1.5 px-4 pt-3 pb-1">
          <FilterPills filter={filter} totalCount={totalCount} mineCount={mineCount} onFilter={setFilter} />
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'info' ? (
          <InfoTab />
        ) : (
          <div className="flex-1 flex flex-col justify-evenly py-4 overflow-hidden">
            {/* Info text */}
            <div className="flex flex-col items-center text-center px-4 space-y-0 leading-none [&>p]:leading-tight">
              {activeCone ? (
                <>
                  <p className="text-[9px] text-black">
                    ({String(activeCone.index).padStart(2, '0')})
                  </p>
                  <p className="text-[10px] uppercase text-center px-4 text-black">
                    {activeCone.description ||
                      (activeCone.is_analyzed ? '—' : 'Analyzing...')}
                  </p>
                  <p className="text-[10px] uppercase text-black">
                    {[activeCone.location, formattedActiveDate]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </>
              ) : filter === 'mine' && mineCount === 0 ? null : (
                <p className="text-[10px] uppercase text-black">
                  Loading...
                </p>
              )}
            </div>

            {/* Carousel — full viewport width, no centering wrapper */}
            <Carousel
              cones={cones}
              currentIndex={currentIndex}
              onChange={setCurrentIndex}
              onOpenProfile={setSelectedCone}
              filter={filter}
              onUploadClick={() => fileInputRef.current?.click()}
            />

            {/* Shuffle button */}
            <div className="flex justify-center">
              {cones.length > 1 ? (
                <button
                  onClick={handleShuffle}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all cursor-pointer"
                >
                  <ShuffleIcon />
                </button>
              ) : (
                <div className="w-10 h-10" />
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Mobile bottom nav (no border) ── */}
      <nav className="md:hidden flex items-end justify-between px-6 pt-2 pb-safe">
        <div className="flex gap-5 pb-3">
          {(['cones', 'info'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative flex flex-col items-center cursor-pointer"
            >
              <span
                className="text-[10px] uppercase pb-1.5"
                style={{ color: activeTab === tab ? '#000' : '#999' }}
              >
                {tab}
              </span>
              {activeTab === tab && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-black" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-lg mb-2 hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
        >
          +
        </button>
      </nav>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {analyzingCone && (
        <ConeProfile
          cone={analyzingCone}
          isAnalyzing={true}
          isOwn={false}
          onClose={() => {
            setAnalyzingCone(null);
            setFilter('mine');
            setActiveTab('cones');
          }}
        />
      )}

      {selectedCone && !analyzingCone && (
        <ConeProfile
          cone={selectedCone}
          isAnalyzing={false}
          isOwn={selectedCone.session_id === sessionId}
          isInMine={selectedCone.session_id === sessionId || selectedCone.session_id === '__seed__'}
          onClose={() => setSelectedCone(null)}
          onDelete={() => handleDelete(selectedCone)}
        />
      )}
    </div>
  );
}
