'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import ConeProfile from './ConeProfile';
import type { Cone } from '@/lib/db';

const GAP_MOBILE = 10; // gap between cards on mobile
const GAP_DESKTOP = 120; // much more spacing on desktop

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

// ── Carousel nav arrows (desktop) ─────────────────────────────────────────────
function LeftArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function RightArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
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
  loading,
  wheelDisabled = false,
  instantPosition = false,
}: {
  cones: Cone[];
  currentIndex: number;
  onChange: (i: number) => void;
  onOpenProfile: (cone: Cone, index: number) => void;
  filter: 'all' | 'mine';
  onUploadClick: () => void;
  loading?: boolean;
  wheelDisabled?: boolean;
  instantPosition?: boolean;
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

  // Base card size — responsive to container width. Desktop (≥768): smaller cones; mobile: unchanged.
  const ITEM_W = useMemo(() => {
    if (containerWidth < 360) return 88;
    if (containerWidth < 480) return 108;
    if (containerWidth < 768) return 126;
    if (containerWidth < 1200) return 64;
    if (containerWidth < 1600) return 72;
    return 80;
  }, [containerWidth]);
  const isDesktop = containerWidth >= 768;
  const GAP = isDesktop ? GAP_DESKTOP : GAP_MOBILE;

  // Center cone scale: on desktop make only the center bigger; mobile keeps 1.38
  const centerScale = isDesktop ? 2.2 : 1.38;
  // Card size by distance from active index — center larger; all non-center cards same smaller size (squares)
  const getCardSize = useCallback(
    (i: number) => {
      const d = Math.abs(i - currentIndex);
      if (d === 0) return Math.round(ITEM_W * centerScale);
      return Math.round(ITEM_W * 0.62);
    },
    [currentIndex, ITEM_W, centerScale]
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
    if (wheelDisabled) return;
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
  }, [currentIndex, cones.length, onChange, wheelDisabled]);

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
    if (delta < -24 && currentIndex < cones.length - 1) onChange(currentIndex + 1);
    else if (delta > 24 && currentIndex > 0) onChange(currentIndex - 1);
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
      if (delta < -24 && currentIndex < cones.length - 1) onChange(currentIndex + 1);
      else if (delta > 24 && currentIndex > 0) onChange(currentIndex - 1);
    }
  };

  // Container always renders with the ref so ResizeObserver can measure correctly.
  // Empty state is rendered inside rather than as an early return.
  const centerSize = Math.round(ITEM_W * centerScale);
  const containerH = centerSize + 20;

  return (
    <div
      ref={containerRef}
      data-carousel-root="1"
      className="relative overflow-hidden select-none w-full touch-pan-y"
      style={{ height: `${containerH}px`, touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={cones.length > 0 ? onMouseDown : undefined}
      onMouseMove={cones.length > 0 ? onMouseMove : undefined}
      onMouseUp={cones.length > 0 ? onMouseUp : undefined}
      onMouseLeave={() => { isDragging.current = false; }}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-[10px] uppercase text-gray-400">Loading...</p>
        </div>
      ) : cones.length === 0 ? (
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
            transition: instantPosition ? 'none' : 'transform 0.36s cubic-bezier(0.4, 0, 0.2, 1)',
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
                className="flex-shrink-0 overflow-hidden bg-gray-50 group"
                style={{
                  width: size,
                  height: size,
                  transition: instantPosition
                    ? 'none'
                    : 'width 0.36s cubic-bezier(0.4, 0, 0.2, 1), height 0.36s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.36s',
                  opacity,
                  cursor: 'pointer',
                  zIndex: isActive ? 10 : 1,
                  position: 'relative',
                }}
                onClick={() => {
                  if (wasDragging.current) return;
                  if (isActive) {
                    onOpenProfile(cone, i);
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
                {isActive && isDesktop && (
                  <div
                    className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  >
                    👀
                  </div>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coneImageRef = useRef<HTMLImageElement | null>(null);
  const maskDataRef = useRef<{ data: Uint8ClampedArray; w: number; h: number } | null>(null);
  const maskRafRef = useRef<number | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const buildMask = useCallback(() => {
    const canvas = canvasRef.current;
    const img = coneImageRef.current;
    if (!canvas || !img || !img.complete || !img.naturalWidth || canvas.width === 0 || canvas.height === 0) return;
    const w = canvas.width;
    const h = canvas.height;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.min(w / iw, h / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (w - sw) / 2;
    const sy = (h - sh) / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, iw, ih, sx, sy, sw, sh);
    const data = ctx.getImageData(0, 0, w, h).data;
    maskDataRef.current = { data, w, h };
  }, []);

  const isOnCone = useCallback((x: number, y: number): boolean => {
    const mask = maskDataRef.current;
    if (!mask) return false;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= mask.w || iy < 0 || iy >= mask.h) return false;
    const i = (iy * mask.w + ix) * 4;
    const r = mask.data[i];
    const g = mask.data[i + 1];
    const b = mask.data[i + 2];
    return r + g + b > 40;
  }, []);

  const getCanvasPoint = useCallback((e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const snapshotCanvas = useCallback((): ImageData | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx || canvas.width === 0 || canvas.height === 0) return null;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, []);

  const applyImageData = useCallback((image: ImageData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(image, 0, 0);
  }, []);

  const drawLine = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isMobile ? 4 : 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    },
    [strokeColor]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const pt = getCanvasPoint(e);
      if (!pt) return;
      const snap = snapshotCanvas();
      if (snap) {
        undoStackRef.current.push(snap);
        redoStackRef.current = [];
        setCanUndo(undoStackRef.current.length > 0);
        setCanRedo(false);
      }
      isDrawingRef.current = true;
      lastPointRef.current = isOnCone(pt.x, pt.y) ? pt : null;
    },
    [getCanvasPoint, isOnCone, snapshotCanvas]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pt = getCanvasPoint(e);
      if (!pt) return;
      const onCone = isOnCone(pt.x, pt.y);
      const last = lastPointRef.current;
      if (last && onCone) {
        drawLine(last, pt);
      }
      lastPointRef.current = onCone ? pt : null;
    },
    [getCanvasPoint, drawLine, isOnCone]
  );

  const handlePointerUp = useCallback(() => {
    if (isDrawingRef.current) setHasDrawn(true);
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (isDrawingRef.current) setHasDrawn(true);
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (undoStackRef.current.length === 0) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const prev = undoStackRef.current.pop() as ImageData;
    redoStackRef.current.push(current);
    applyImageData(prev);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
    setHasDrawn(undoStackRef.current.length > 0 || !prev.data.every((v, i) => (i % 4 === 3 ? v === 0 : v === 0)));
  }, [applyImageData]);

  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (redoStackRef.current.length === 0) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const next = redoStackRef.current.pop() as ImageData;
    undoStackRef.current.push(current);
    applyImageData(next);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
    setHasDrawn(true);
  }, [applyImageData]);

  // Build mask when image has loaded (and canvas may already be sized)
  useEffect(() => {
    if (!imageLoaded) return;
    if (maskRafRef.current != null) cancelAnimationFrame(maskRafRef.current);
    maskRafRef.current = requestAnimationFrame(() => {
      maskRafRef.current = null;
      buildMask();
    });
    return () => {
      if (maskRafRef.current != null) cancelAnimationFrame(maskRafRef.current);
    };
  }, [imageLoaded, buildMask]);

  // Set canvas size to match display; rebuild mask when size changes
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isMobile ? 4 : 3;
          ctx.lineCap = 'round';
        }
        maskDataRef.current = null;
        if (maskRafRef.current != null) cancelAnimationFrame(maskRafRef.current);
        maskRafRef.current = requestAnimationFrame(() => {
          maskRafRef.current = null;
          buildMask();
        });
      }
    });
    ro.observe(container);
    return () => {
      ro.disconnect();
      if (maskRafRef.current != null) cancelAnimationFrame(maskRafRef.current);
    };
  }, [buildMask]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <img
        ref={coneImageRef}
        src="/cone-info.png"
        alt=""
        className="hidden"
        crossOrigin="anonymous"
        onLoad={() => setImageLoaded(true)}
      />
      <div
        ref={containerRef}
        className="relative w-full max-w-[380px] md:max-w-[520px] aspect-square touch-none select-none mt-10 md:mt-0"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerUp}
      >
        <img
          src="/cone-info.png"
          alt=""
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>
      <div className="mt-3 flex items-center justify-center">
        {/* Color palette */}
        <div className="flex items-center gap-1.5">
          {['#000000', '#f97316', '#22c55e', '#0ea5e9', '#ffffff'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setStrokeColor(c)}
              className="w-3.5 h-3.5 rounded-full border cursor-pointer"
              style={{
                backgroundColor: c,
                borderColor: strokeColor === c ? '#111' : '#d4d4d4',
              }}
            />
          ))}
        </div>
      </div>
      {/* Undo / Clear / Redo row (visible only after drawing) */}
      <div className="mt-3 flex items-center justify-center gap-5 h-7">
        {hasDrawn && (
          <>
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="w-6 h-6 flex items-center justify-center select-none text-[11px]"
              style={{
                color: canUndo ? '#6b7280' : '#d1d5db',
                cursor: canUndo ? 'pointer' : 'default',
              }}
            >
              ↺
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-[10px] uppercase text-gray-400 hover:text-gray-600 cursor-pointer select-none"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="w-6 h-6 flex items-center justify-center select-none text-[11px]"
              style={{
                color: canRedo ? '#6b7280' : '#d1d5db',
                cursor: canRedo ? 'pointer' : 'default',
              }}
            >
              ↻
            </button>
          </>
        )}
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
    <div className="flex items-center gap-1">
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
    </div>
  );
}

// ── Index View (grid of cone rows) ─────────────────────────────────────────────
function IndexView({
  cones,
  onOpenProfile,
  loading,
  scrollToIndex,
  onScrolledToIndex,
}: {
  cones: Cone[];
  onOpenProfile: (cone: Cone, index: number) => void;
  loading?: boolean;
  scrollToIndex?: number | null;
  onScrolledToIndex?: () => void;
}) {
  const formatDate = (created_at: string) => {
    const d = new Date(created_at);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(2);
    return `${mm}/${dd}/${yy}`;
  };

  useEffect(() => {
    if (scrollToIndex == null || scrollToIndex < 0 || scrollToIndex >= cones.length) return;
    const el = document.getElementById('index-view-scroll-target');
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'auto' });
      onScrolledToIndex?.();
    }
  }, [scrollToIndex, cones.length, onScrolledToIndex]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <p className="text-[10px] uppercase text-gray-400">Loading...</p>
      </div>
    );
  }

  if (cones.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <p className="text-[10px] uppercase text-gray-300">No cones yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-8 md:pt-12 pb-4">
      <div
        className="grid gap-x-4 gap-y-8 w-full md:gap-x-32"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
      >
        {cones.map((cone, i) => (
          <button
            key={cone.id}
            type="button"
            id={scrollToIndex === i ? 'index-view-scroll-target' : undefined}
            onClick={() => onOpenProfile(cone, i)}
            className="w-full flex items-center gap-2 text-left rounded border border-transparent px-0 py-2 md:px-2 md:-m-2"
          >
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-[10px] text-black leading-tight">
                ({String(cone.index).padStart(2, '0')})
              </p>
              <p className="text-[10px] uppercase leading-tight truncate text-black">
                {cone.description || (cone.is_analyzed ? '—' : 'Analyzing...')}
              </p>
              <p className="text-[10px] text-black leading-tight">
                {formatDate(cone.created_at)}
              </p>
            </div>
            <div className="w-[56px] h-[56px] flex-shrink-0 overflow-hidden bg-gray-100">
              {cone.image_path && (
                <img
                  src={cone.image_path}
                  alt={cone.description || 'Cone'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function ConesApp() {
  const [cones, setCones] = useState<Cone[]>([]);
  const [conesLoading, setConesLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [mineCount, setMineCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'index'>('list');
  const [activeTab, setActiveTab] = useState<'cones' | 'info'>('cones');
  const [isUploading, setIsUploading] = useState(false);
  const [analyzingCone, setAnalyzingCone] = useState<Cone | null>(null);
  const [lastUploadedCone, setLastUploadedCone] = useState<Cone | null>(null);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropScale, setCropScale] = useState(1);
  const [cropTranslate, setCropTranslate] = useState({ x: 0, y: 0 });
  const cropGestureRef = useRef<{
    startX: number; startY: number; baseTx: number; baseTy: number;
    pinchStartDist?: number; pinchBaseScale?: number;
  } | null>(null);
  const cropNaturalRef = useRef<{ w: number; h: number } | null>(null);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const undoStackRef = useRef<Cone[]>([]);
  const redoStackRef = useRef<Cone[]>([]);
  const pendingRestoreIndexRef = useRef<number | null>(null);
  const hasCachedConesRef = useRef(false);
  const [restoreInstant, setRestoreInstant] = useState(false);
  const [returnScrollIndex, setReturnScrollIndex] = useState<number | null>(null);
  const router = useRouter();

  // Desktop: page-level horizontal wheel/touch so swipe moves carousel and doesn't trigger browser back
  const [isDesktop, setIsDesktop] = useState(false);
  const conesContentRef = useRef<HTMLDivElement>(null);
  const pageWheelAccumulator = useRef(0);
  const pageLastSnapTime = useRef(0);
  const pageWheelResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageSteppedRef = useRef(false);
  const pageTouchStartX = useRef(0);
  const pageTouchStartY = useRef(0);
  const globalTouchStartX = useRef(0);
  const globalTouchStartY = useRef(0);
  const navRepeatTimeoutRef = useRef<number | null>(null);
  const navRepeatIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let sid = localStorage.getItem('cones_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('cones_session_id', sid);
    }
    setSessionId(sid);
    // Restore carousel position when returning from a cone profile
    if (typeof window !== 'undefined') {
      const returnIndex = sessionStorage.getItem('cones_return_index');
      const returnFilter = sessionStorage.getItem('cones_return_filter');
      const returnView = sessionStorage.getItem('cones_return_view');
      if (returnIndex != null && returnFilter) {
        setFilter(returnFilter as 'all' | 'mine');
        pendingRestoreIndexRef.current = parseInt(returnIndex, 10);
        if (returnView === 'index') {
          setViewMode('index');
          setReturnScrollIndex(parseInt(returnIndex, 10));
          sessionStorage.removeItem('cones_return_view');
        }
        sessionStorage.removeItem('cones_return_index');
        sessionStorage.removeItem('cones_return_filter');
      }
      // If we just deleted a cone in profile view, seed undo stack and show toast
      const lastDeletedRaw = sessionStorage.getItem('cones_last_deleted_cone');
      if (lastDeletedRaw) {
        try {
          const c = JSON.parse(lastDeletedRaw) as Cone;
          undoStackRef.current.push(c);
          setToastMessage('Cone deleted');
        } catch {
          // ignore parse error
        } finally {
          sessionStorage.removeItem('cones_last_deleted_cone');
        }
      }
      // Instant carousel: show cached list while fetching
      try {
        const cached = sessionStorage.getItem('cones_carousel_cache');
        const cachedFilter = sessionStorage.getItem('cones_carousel_filter');
        const cachedTotals = sessionStorage.getItem('cones_carousel_totals');
        if (cached && cachedFilter) {
          const list = JSON.parse(cached) as Cone[];
          setCones(list);
          setFilter(cachedFilter as 'all' | 'mine');
          if (cachedTotals) {
            const t = JSON.parse(cachedTotals) as { total: number; mine: number };
            setTotalCount(t.total);
            setMineCount(t.mine);
          }
          setConesLoading(false);
          hasCachedConesRef.current = true;
          if (pendingRestoreIndexRef.current !== null) {
            const displayCones = list.filter((c) => !c.is_impostor);
            const idx = Math.min(
              Math.max(0, pendingRestoreIndexRef.current),
              Math.max(0, displayCones.length - 1)
            );
            setCurrentIndex(idx);
            setRestoreInstant(true);
            pendingRestoreIndexRef.current = null;
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(min-width: 768px)');
    setIsDesktop(m.matches);
    const fn = () => setIsDesktop(m.matches);
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);

  const fetchCones = useCallback(async (f: 'all' | 'mine', sid: string): Promise<Cone[] | void> => {
    if (!sid) return;
    const skipLoading = hasCachedConesRef.current;
    if (skipLoading) hasCachedConesRef.current = false;
    if (!skipLoading) setConesLoading(true);
    try {
      const res = await fetch(`/api/cones?filter=${f}&session_id=${sid}`);
      const data = await res.json();
      const list: Cone[] = (data.cones ?? []).sort(
        (a: Cone, b: Cone) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setCones(list);
      setTotalCount(data.total ?? 0);
      setMineCount(data.totalMine ?? 0);
      // Only recenter to the middle when we don't already have a specific
      // return index requested (e.g. after viewing a profile or upload).
      if (!skipLoading && pendingRestoreIndexRef.current === null) {
        const displayCones = list.filter((c: Cone) => !c.is_impostor);
        setCurrentIndex(
          displayCones.length > 0 ? Math.floor((displayCones.length - 1) / 2) : 0
        );
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cones_carousel_cache', JSON.stringify(list));
        sessionStorage.setItem('cones_carousel_filter', f);
        sessionStorage.setItem(
          'cones_carousel_totals',
          JSON.stringify({ total: data.total ?? 0, mine: data.totalMine ?? 0 })
        );
      }
      return list;
    } catch {
      // ignore
    } finally {
      setConesLoading(false);
    }
  }, []);

  // Cones shown in carousel exclude impostors
  const displayCones = useMemo(
    () => cones.filter((c) => !c.is_impostor),
    [cones]
  );

  useEffect(() => {
    if (sessionId) fetchCones(filter, sessionId);
  }, [sessionId, filter, fetchCones]);

  // Restore carousel index when returning from cone profile (after cones are loaded)
  useEffect(() => {
    if (displayCones.length > 0 && pendingRestoreIndexRef.current !== null) {
      const idx = Math.min(
        Math.max(0, pendingRestoreIndexRef.current),
        displayCones.length - 1
      );
      setCurrentIndex(idx);
      setRestoreInstant(true);
      pendingRestoreIndexRef.current = null;
    }
  }, [displayCones.length]);

  // Clear instant-position flag after one paint so next user navigation still animates
  useEffect(() => {
    if (!restoreInstant) return;
    const id = requestAnimationFrame(() => setRestoreInstant(false));
    return () => cancelAnimationFrame(id);
  }, [restoreInstant]);

  // Cones tab: capture horizontal wheel/touch on whole area — move carousel, prevent browser back/forward
  useEffect(() => {
    if (activeTab !== 'cones') return;
    const SNAP_COOLDOWN = 800; // gesture reset window; no delay before first step
    const THRESHOLD = 0.5; // treat even very light horizontal swipe as intent to move

    const handleWheel = (e: WheelEvent) => {
      if (!isDesktop) return;
      const isHorizontal =
        Math.abs(e.deltaX) >= Math.abs(e.deltaY) || Math.abs(e.deltaX) > 1;
      if (!isHorizontal) return;

      e.preventDefault();
      e.stopPropagation();

      if (pageSteppedRef.current) return;

      const now = Date.now();
      const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < THRESHOLD) return;

      const dir = delta > 0 ? 1 : -1;
      setCurrentIndex((i) =>
        Math.min(displayCones.length - 1, Math.max(0, i + dir))
      );
      pageLastSnapTime.current = now;
      pageSteppedRef.current = true;
      if (pageWheelResetTimer.current) clearTimeout(pageWheelResetTimer.current);
      // Treat a hardware swipe as a single gesture: require a long enough
      // idle period before allowing another step.
      pageWheelResetTimer.current = setTimeout(() => {
        pageWheelAccumulator.current = 0;
        pageSteppedRef.current = false;
      }, SNAP_COOLDOWN);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const el = conesContentRef.current;
      if (!el) return;
      if (e.touches.length !== 1) return;
      pageTouchStartX.current = e.touches[0].clientX;
      pageTouchStartY.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const el = conesContentRef.current;
      if (!el) return;
      if (e.touches.length !== 1) return;
      const dx = Math.abs(e.touches[0].clientX - pageTouchStartX.current);
      const dy = Math.abs(e.touches[0].clientY - pageTouchStartY.current);
      if (dx > dy && dx > 8) {
        // Prevent browser back/forward gesture on horizontal swipe in cones tab
        e.preventDefault();
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const el = conesContentRef.current;
      if (!el) return;
      if (displayCones.length === 0) return;
      if (e.changedTouches.length === 0) return;
      // On mobile, let the Carousel component handle swipes that start directly on it
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        const target = e.target as HTMLElement | null;
        if (target && target.closest('[data-carousel-root=\"1\"]')) {
          return;
        }
      }
      const t = e.changedTouches[0];
      const dx = t.clientX - pageTouchStartX.current;
      const dy = Math.abs(t.clientY - pageTouchStartY.current);
      // Only treat clearly horizontal, long-enough swipes as carousel navigation
      if (Math.abs(dx) < 24 || Math.abs(dx) <= dy) return;
      if (dx < 0) {
        setCurrentIndex((i) => Math.min(displayCones.length - 1, i + 1));
      } else {
        setCurrentIndex((i) => Math.max(0, i - 1));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    const el = conesContentRef.current;
    if (el) {
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchmove', handleTouchMove, { passive: false });
      el.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true } as any);
      if (el) {
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchmove', handleTouchMove);
        el.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isDesktop, activeTab, viewMode, displayCones.length]);

  // Mobile: prevent browser back/forward gesture anywhere in cones tab on horizontal swipe
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      globalTouchStartX.current = t.clientX;
      globalTouchStartY.current = t.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (activeTab !== 'cones') return;
      if (window.innerWidth >= 768) return; // desktop already handled
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - globalTouchStartX.current);
      const dy = Math.abs(t.clientY - globalTouchStartY.current);
      // For clearly horizontal swipes, prevent browser navigation gesture
      if (dx > dy && dx > 8) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [activeTab]);

  const uploadConeFile = async (file: File) => {
    if (!sessionId) return;
    setIsUploading(true);
    setAnalyzingCone(null);

    const blobUrl = URL.createObjectURL(file);
    const tempCone: Cone = {
      id: 'temp',
      session_id: sessionId,
      image_path: blobUrl,
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
      song_url: null,
      bandcamp_album_id: null,
      bandcamp_track_id: null,
      sloan: null,
      is_impostor: 0,
      is_analyzed: 0,
      created_at: new Date().toISOString(),
      index: displayCones.length + 1,
    };
    setAnalyzingCone(tempCone);
    setLastUploadedCone(tempCone);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('session_id', sessionId);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.cone) {
        URL.revokeObjectURL(blobUrl);
        const list = await fetchCones('mine', sessionId);
        const displayCones = list ? list.filter((c: Cone) => !c.is_impostor) : [];
        const idx = displayCones.findIndex((c) => c.id === data.cone.id);
        const indexedCone: Cone = {
          ...(data.cone as Cone),
          index: idx >= 0 ? idx + 1 : displayCones.length > 0 ? displayCones.length : 1,
        };
        setAnalyzingCone(indexedCone);
        setLastUploadedCone(indexedCone);
        if (data.cone.is_impostor) {
          setFilter('mine');
          sessionStorage.setItem('cones_profile_key', data.cone.id);
          sessionStorage.setItem('cones_profile_cone', JSON.stringify(data.cone));
          router.push(`/cones/${data.cone.id}?filter=mine`);
        } else if (displayCones.length > 0) {
          const arrayIndex = idx >= 0 ? idx : displayCones.length - 1;
          setCurrentIndex(arrayIndex);
          const urlKey = String(arrayIndex + 1);
          sessionStorage.setItem('cones_display_list', JSON.stringify(displayCones));
          sessionStorage.setItem('cones_profile_key', urlKey);
          sessionStorage.setItem('cones_profile_cone', JSON.stringify(displayCones[arrayIndex]));
          router.push(`/cones/${urlKey}?filter=mine`);
        }
        setFilter('mine');
      }
    } catch {
      URL.revokeObjectURL(blobUrl);
      setAnalyzingCone(null);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;
    e.target.value = '';
    setAnalyzingCone(null);
    const url = URL.createObjectURL(file);
    setPendingUploadFile(file);
    setCropPreviewUrl(url);
    setCropScale(1);
    setCropTranslate({ x: 0, y: 0 });
    cropNaturalRef.current = null;
    setIsCropping(true);
  };

  const handleDelete = async (cone: Cone) => {
    if (!sessionId) {
      router.push('/');
      fetchCones(filter, sessionId);
      return;
    }
    undoStackRef.current.push(cone);
    redoStackRef.current = [];
    const res = await fetch(`/api/cones/${cone.id}?session_id=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      sessionStorage.removeItem('cones_display_list');
      sessionStorage.removeItem('cones_profile_key');
      sessionStorage.removeItem('cones_profile_cone');
      router.push('/');
      fetchCones(filter, sessionId);
    } else {
      undoStackRef.current.pop();
    }
  };

  const handleUndo = useCallback(async () => {
    setToastMessage(null);
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
        const list = await fetchCones(filter, sessionId);
        const display = list ? list.filter((c) => !c.is_impostor) : [];
        const idx = display.findIndex((c) => c.id === cone.id);
        if (idx >= 0) setCurrentIndex(idx);
        setToastMessage('Cone restored');
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
        setToastMessage('Cone deleted');
      } else {
        redoStackRef.current.push(cone);
      }
    } catch {
      redoStackRef.current.push(cone);
    }
  }, [sessionId, filter, fetchCones]);

  async function cropImageToSquare(
    file: File,
    tx = 0,
    ty = 0,
    userScale = 1,
    containerSize = 300,
  ): Promise<File> {
    const img = document.createElement('img');
    const src = URL.createObjectURL(file);
    img.src = src;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
    });

    const baseCoverScale = Math.max(containerSize / img.width, containerSize / img.height);
    const totalScale = baseCoverScale * userScale;
    const cropSide = containerSize / totalScale;
    const centerSrcX = -tx / totalScale + img.width / 2;
    const centerSrcY = -ty / totalScale + img.height / 2;
    const srcX = Math.max(0, Math.min(img.width - cropSide, centerSrcX - cropSide / 2));
    const srcY = Math.max(0, Math.min(img.height - cropSide, centerSrcY - cropSide / 2));
    const outputSize = Math.round(cropSide);

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.drawImage(img, srcX, srcY, cropSide, cropSide, 0, 0, outputSize, outputSize);
    URL.revokeObjectURL(src);

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), file.type || 'image/jpeg')
    );

    return new File([blob], file.name || 'cone-square.jpg', { type: blob.type });
  }

  const getCropMaxPan = (containerSize: number, s: number) => {
    const maxPan = (s - 1) * containerSize / 2;
    return { maxPanX: maxPan, maxPanY: maxPan };
  };

  const handleCropTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      cropGestureRef.current = { startX: t.clientX, startY: t.clientY, baseTx: cropTranslate.x, baseTy: cropTranslate.y };
    } else if (e.touches.length >= 2) {
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      cropGestureRef.current = { startX: midX, startY: midY, baseTx: cropTranslate.x, baseTy: cropTranslate.y, pinchStartDist: dist, pinchBaseScale: cropScale };
    }
  };

  const handleCropTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const g = cropGestureRef.current;
    if (!g) return;
    const containerSize = cropContainerRef.current?.offsetWidth ?? 300;
    if (e.touches.length === 1 && g.pinchStartDist == null) {
      const t = e.touches[0];
      const { maxPanX, maxPanY } = getCropMaxPan(containerSize, cropScale);
      setCropTranslate({
        x: Math.max(-maxPanX, Math.min(maxPanX, g.baseTx + t.clientX - g.startX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, g.baseTy + t.clientY - g.startY)),
      });
    } else if (e.touches.length >= 2 && g.pinchStartDist != null && g.pinchBaseScale != null) {
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const newScale = Math.max(1, Math.min(5, g.pinchBaseScale * dist / g.pinchStartDist));
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const { maxPanX, maxPanY } = getCropMaxPan(containerSize, newScale);
      setCropScale(newScale);
      setCropTranslate({
        x: Math.max(-maxPanX, Math.min(maxPanX, g.baseTx + midX - g.startX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, g.baseTy + midY - g.startY)),
      });
    }
  };

  // Prevent page zoom while cropping (pinch on mobile, ctrl+scroll on desktop)
  useEffect(() => {
    if (!isCropping) return;
    const noZoom = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('touchmove', noZoom, { passive: false });
    return () => document.removeEventListener('touchmove', noZoom);
  }, [isCropping]);

  // Non-passive wheel listener: ctrl/pinch = zoom, plain scroll = pan
  useEffect(() => {
    if (!isCropping) return;
    const el = cropContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const containerSize = el.offsetWidth;
      if (e.ctrlKey) {
        // Pinch-to-zoom (trackpad) or ctrl+scroll
        setCropScale(prev => {
          const newScale = Math.max(1, Math.min(5, prev * (1 - e.deltaY * 0.004)));
          const maxPan = (newScale - 1) * containerSize / 2;
          setCropTranslate(pt => ({
            x: Math.max(-maxPan, Math.min(maxPan, pt.x)),
            y: Math.max(-maxPan, Math.min(maxPan, pt.y)),
          }));
          return newScale;
        });
      } else {
        // Trackpad two-finger scroll = pan
        setCropScale(prev => {
          const maxPan = (prev - 1) * containerSize / 2;
          setCropTranslate(pt => ({
            x: Math.max(-maxPan, Math.min(maxPan, pt.x - e.deltaX * 0.004 * containerSize)),
            y: Math.max(-maxPan, Math.min(maxPan, pt.y - e.deltaY * 0.004 * containerSize)),
          }));
          return prev;
        });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isCropping]);

  const handleCropMouseDown = (e: React.MouseEvent) => {
    cropGestureRef.current = { startX: e.clientX, startY: e.clientY, baseTx: cropTranslate.x, baseTy: cropTranslate.y };
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!cropGestureRef.current || cropGestureRef.current.pinchStartDist != null || !(e.buttons & 1)) return;
    const g = cropGestureRef.current;
    const containerSize = cropContainerRef.current?.offsetWidth ?? 300;
    const { maxPanX, maxPanY } = getCropMaxPan(containerSize, cropScale);
    setCropTranslate({
      x: Math.max(-maxPanX, Math.min(maxPanX, g.baseTx + e.clientX - g.startX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, g.baseTy + e.clientY - g.startY)),
    });
  };

  const confirmCropAndUpload = async () => {
    if (!pendingUploadFile) return;
    try {
      const containerSize = cropContainerRef.current?.offsetWidth ?? 300;
      const cropped = await cropImageToSquare(pendingUploadFile, cropTranslate.x, cropTranslate.y, cropScale, containerSize);
      if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl);
      setIsCropping(false);
      setCropPreviewUrl(null);
      setPendingUploadFile(null);
      await uploadConeFile(cropped);
    } catch {
      // Fallback: try original file
      if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl);
      const original = pendingUploadFile;
      setIsCropping(false);
      setCropPreviewUrl(null);
      setPendingUploadFile(null);
      await uploadConeFile(original);
    }
  };

  const cancelCrop = () => {
    if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl);
    setCropPreviewUrl(null);
    setPendingUploadFile(null);
    setIsCropping(false);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

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
    if (displayCones.length === 0) return;
    let newIdx = currentIndex;
    while (newIdx === currentIndex && displayCones.length > 1) {
      newIdx = Math.floor(Math.random() * displayCones.length);
    }
    setCurrentIndex(newIdx);
  };

  const startNavRepeat = (dir: -1 | 1) => {
    if (navRepeatTimeoutRef.current != null || navRepeatIntervalRef.current != null) return;
    navRepeatTimeoutRef.current = window.setTimeout(() => {
      navRepeatTimeoutRef.current = null;
      navRepeatIntervalRef.current = window.setInterval(() => {
        setCurrentIndex((i) =>
          dir < 0 ? Math.max(0, i - 1) : Math.min(displayCones.length - 1, i + 1)
        );
      }, 120);
    }, 280);
  };

  const stopNavRepeat = () => {
    if (navRepeatTimeoutRef.current != null) {
      clearTimeout(navRepeatTimeoutRef.current);
      navRepeatTimeoutRef.current = null;
    }
    if (navRepeatIntervalRef.current != null) {
      clearInterval(navRepeatIntervalRef.current);
      navRepeatIntervalRef.current = null;
    }
  };

  const activeCone = displayCones[currentIndex];
  const infoCone = lastUploadedCone ?? activeCone;

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
    <div
      className={`flex flex-col h-[100dvh] bg-white overflow-hidden ${
        activeTab === 'cones' ? 'select-none' : ''
      }`}
    >
      {/* ── Crop overlay (mobile & desktop) ── */}
      {isCropping && cropPreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6 gap-8 md:gap-24"
        >
          <p className="text-[10px] uppercase text-gray-600">
            Zoom/Pan to Crop
          </p>
          <div
            ref={cropContainerRef}
            className="w-full max-w-xs md:w-[300px] md:max-w-[300px] aspect-square bg-gray-100 overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onTouchStart={handleCropTouchStart}
            onTouchMove={handleCropTouchMove}
            onTouchEnd={() => { cropGestureRef.current = null; }}

            onMouseDown={handleCropMouseDown}
            onMouseMove={handleCropMouseMove}
            onMouseUp={() => { cropGestureRef.current = null; }}
            onMouseLeave={() => { cropGestureRef.current = null; }}
          >
            <img
              src={cropPreviewUrl}
              alt="Cone preview"
              className="w-full h-full object-cover pointer-events-none select-none"
              style={{ transform: `translate(${cropTranslate.x}px, ${cropTranslate.y}px) scale(${cropScale})`, transformOrigin: 'center center' }}
              onLoad={(e) => {
                const el = e.currentTarget;
                cropNaturalRef.current = { w: el.naturalWidth, h: el.naturalHeight };
              }}
              draggable={false}
            />
          </div>
          <div className="flex flex-col items-center gap-3 w-full max-w-xs md:max-w-[300px]">
            <button
              type="button"
              onClick={confirmCropAndUpload}
              className="w-48 text-[10px] uppercase bg-black text-white rounded-full py-2 h-9 cursor-pointer"
            >
              Start Analyzing
            </button>
            <button
              type="button"
              onClick={cancelCrop}
              className="text-[10px] uppercase text-gray-500 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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

        {activeTab === 'cones' && (
          <div className="flex items-center gap-1.5">
            <FilterPills filter={filter} totalCount={totalCount} mineCount={mineCount} onFilter={setFilter} />
          </div>
        )}

        <div className="flex items-center gap-8">
          <div className="inline-flex items-center gap-2 rounded-full">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="text-[11px] font-medium uppercase text-[#888] hover:text-gray-700 select-none cursor-pointer transition-colors"
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'list' ? 'index' : 'list')}
              className={`flex items-center rounded-full h-[22px] w-[34px] p-0.5 bg-[#f4f4f4] cursor-pointer shrink-0 ${viewMode === 'list' ? 'justify-start' : 'justify-end'}`}
              aria-label={viewMode === 'list' ? 'Switch to index view' : 'Switch to list view'}
            >
              <span className="w-2 h-2 rounded-full bg-[#333] shrink-0 transition-all duration-150" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('index')}
              className="text-[11px] font-medium uppercase text-[#888] hover:text-gray-700 select-none cursor-pointer transition-colors"
            >
              Index
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-sm leading-none hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            +
          </button>
        </div>
      </header>

      {/* ── Mobile top filter ── */}
      {activeTab === 'cones' && (
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-2 px-4 pt-3 pb-1 bg-white">
          <FilterPills filter={filter} totalCount={totalCount} mineCount={mineCount} onFilter={setFilter} />
          <div className="inline-flex items-center gap-2 rounded-full">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="text-[11px] font-medium uppercase text-[#888] hover:text-gray-700 select-none cursor-pointer transition-colors"
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'list' ? 'index' : 'list')}
              className={`flex items-center rounded-full h-[22px] w-[34px] p-0.5 bg-[#f4f4f4] cursor-pointer shrink-0 ${viewMode === 'list' ? 'justify-start' : 'justify-end'}`}
              aria-label={viewMode === 'list' ? 'Switch to index view' : 'Switch to list view'}
            >
              <span className="w-2 h-2 rounded-full bg-[#333] shrink-0 transition-all duration-150" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('index')}
              className="text-[11px] font-medium uppercase text-[#888] hover:text-gray-700 select-none cursor-pointer transition-colors"
            >
              Index
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'info' ? (
          <InfoTab />
        ) : viewMode === 'index' ? (
          <IndexView
            cones={displayCones}
            loading={conesLoading}
            scrollToIndex={returnScrollIndex}
            onScrolledToIndex={() => setReturnScrollIndex(null)}
            onOpenProfile={(cone, index) => {
              sessionStorage.setItem('cones_return_index', String(index));
              sessionStorage.setItem('cones_return_filter', filter);
              sessionStorage.setItem('cones_return_view', 'index');
              sessionStorage.setItem('cones_display_list', JSON.stringify(displayCones));
              const urlKey = String(index + 1);
              sessionStorage.setItem('cones_profile_key', urlKey);
              sessionStorage.setItem('cones_profile_cone', JSON.stringify(cone));
              router.push(`/cones/${urlKey}${filter === 'mine' ? '?filter=mine' : ''}`);
            }}
          />
        ) : (
          <div
            ref={conesContentRef}
            className="flex-1 flex flex-col justify-evenly py-4 overflow-hidden"
          >
            {/* Info text / last uploaded cone (no thumbnail) */}
            <div className="flex flex-col items-center text-center px-4 space-y-0.5 leading-none [&>p]:leading-tight">
              {infoCone ? (
                <>
                  <p className="text-[9px] text-black">
                    ({String(infoCone.index).padStart(2, '0')})
                  </p>
                  <p className="text-[10px] uppercase text-center px-4 text-black">
                    {infoCone.description ||
                      (infoCone.is_analyzed ? '—' : 'Analyzing...')}
                  </p>
                  {formattedActiveDate && (
                    <p className="text-[10px] uppercase text-black">
                      {formattedActiveDate}
                    </p>
                  )}
                </>
              ) : conesLoading || displayCones.length === 0 ? null : filter === 'mine' && mineCount === 0 ? null : (
                <p className="text-[10px] uppercase text-black">
                  Loading...
                </p>
              )}
            </div>

            {/* Carousel — full viewport width, no centering wrapper */}
            <Carousel
              cones={displayCones}
              currentIndex={currentIndex}
              onChange={setCurrentIndex}
              wheelDisabled={isDesktop}
              instantPosition={restoreInstant}
              onOpenProfile={(cone, index) => {
                sessionStorage.setItem('cones_return_index', String(index));
                sessionStorage.setItem('cones_return_filter', filter);
                sessionStorage.setItem('cones_display_list', JSON.stringify(displayCones));
                const urlKey = String(index + 1);
                sessionStorage.setItem('cones_profile_key', urlKey);
                sessionStorage.setItem('cones_profile_cone', JSON.stringify(cone));
                router.push(`/cones/${urlKey}${filter === 'mine' ? '?filter=mine' : ''}`);
              }}
              filter={filter}
              onUploadClick={() => fileInputRef.current?.click()}
              loading={conesLoading}
            />

            {/* Shuffle button — desktop: with left/right arrows */}
            <div className="flex justify-center items-center gap-2">
              {/* Arrows + shuffle */}
              <button
                type="button"
                aria-label="Previous cone"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={displayCones.length <= 1 || currentIndex === 0}
                className="flex w-9 h-9 md:w-10 md:h-10 rounded-full bg-white items-center justify-center text-gray-500 md:hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  startNavRepeat(-1);
                }}
                onMouseUp={stopNavRepeat}
                onMouseLeave={stopNavRepeat}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startNavRepeat(-1);
                }}
                onTouchEnd={stopNavRepeat}
                onTouchCancel={stopNavRepeat}
              >
                <LeftArrowIcon />
              </button>
              {displayCones.length > 1 ? (
                <button
                  onClick={handleShuffle}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 md:hover:bg-gray-200 transition-all cursor-pointer"
                >
                  <ShuffleIcon />
                </button>
              ) : (
                <div className="w-10 h-10" />
              )}
              <button
                type="button"
                aria-label="Next cone"
                onClick={() => setCurrentIndex((i) => Math.min(displayCones.length - 1, i + 1))}
                disabled={displayCones.length <= 1 || currentIndex === displayCones.length - 1}
                className="flex w-9 h-9 md:w-10 md:h-10 rounded-full bg-white items-center justify-center text-gray-500 md:hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  startNavRepeat(1);
                }}
                onMouseUp={stopNavRepeat}
                onMouseLeave={stopNavRepeat}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startNavRepeat(1);
                }}
                onTouchEnd={stopNavRepeat}
                onTouchCancel={stopNavRepeat}
              >
                <RightArrowIcon />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Toast for delete/undo ── */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 rounded-full bg-black text-white text-[10px] px-4 py-2 flex items-center gap-3 shadow-lg">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => {
              handleUndo();
              setToastMessage(null);
            }}
            className="uppercase underline decoration-white/60 text-[10px]"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[10px] opacity-70"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Mobile bottom nav (no border) ── */}
      <nav className="md:hidden sticky bottom-0 z-30 bg-white flex items-end justify-between px-6 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
        <div className="flex gap-5 pb-4">
          {(['cones', 'info'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative flex flex-col items-center cursor-pointer"
            >
              <span
                className="text-[10px] uppercase pb-1.5 select-none"
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
          className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-lg mb-1 hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
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
    </div>
  );
}
