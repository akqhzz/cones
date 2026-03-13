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
  const desktopCardSize = Math.round(ITEM_W * 1.38);

  // Center cone scale: used for mobile; on desktop all cones share the same size
  const centerScale = isDesktop ? 1 : 1.38;
  // Card size: on desktop make all cards the same size as the center;
  // on mobile, keep a larger center cone and smaller side cones.
  const getCardSize = useCallback(
    (i: number) => {
      if (isDesktop) {
        return desktopCardSize;
      }
      const d = Math.abs(i - currentIndex);
      if (d === 0) return Math.round(ITEM_W * centerScale);
      return Math.round(ITEM_W * 0.62);
    },
    [currentIndex, desktopCardSize, centerScale, isDesktop]
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

  // Smooth trackpad / wheel scrolling (desktop uses global handler; this is primarily for mobile/tablet)
  useEffect(() => {
    if (wheelDisabled || isDesktop) return;
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
    if (isDesktop) return 1;
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
  const centerSize = isDesktop ? desktopCardSize : Math.round(ITEM_W * centerScale);
  // Add a bit of extra height on desktop so the index label above each cone isn't clipped.
  const containerH = centerSize + (isDesktop ? 32 : 20);

  // Desktop: keep currentIndex in sync with smooth horizontal scroll position
  const handleDesktopScroll = useCallback(() => {
    if (!isDesktop) return;
    const el = containerRef.current;
    if (!el || cones.length === 0) return;
    const cardStride = desktopCardSize + GAP;
    if (cardStride <= 0) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const atEnd = el.scrollLeft >= maxScroll - 1;
    // If we are close enough to the end, clamp index to the last cone so
    // the ">" arrow immediately reflects that we can't scroll further.
    if (atEnd && currentIndex !== cones.length - 1) {
      onChange(cones.length - 1);
      return;
    }

    const approx = Math.round(el.scrollLeft / cardStride);
    const clamped = Math.min(cones.length - 1, Math.max(0, approx));
    if (clamped !== currentIndex) {
      onChange(clamped);
    }
  }, [isDesktop, cones.length, desktopCardSize, GAP, currentIndex, onChange]);

  return (
    <div
      ref={containerRef}
      data-carousel-root="1"
      className={`relative select-none w-full touch-pan-y ${
        isDesktop ? 'overflow-x-auto overflow-y-hidden md:[&::-webkit-scrollbar]:hidden md:[scrollbar-width:none]' : 'overflow-hidden'
      }`}
      style={{ height: `${containerH}px`, touchAction: isDesktop ? 'auto' : 'pan-y' }}
      onScroll={isDesktop ? handleDesktopScroll : undefined}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={cones.length > 0 && !isDesktop ? onMouseDown : undefined}
      onMouseMove={cones.length > 0 && !isDesktop ? onMouseMove : undefined}
      onMouseUp={cones.length > 0 && !isDesktop ? onMouseUp : undefined}
      onMouseLeave={() => {
        isDragging.current = false;
      }}
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
      ) : isDesktop ? (
        <div
          className="flex items-center h-full cursor-pointer"
          style={{ gap: GAP, paddingLeft: 20, paddingRight: 0 }}
        >
          {cones.map((cone, i) => {
            const size = getCardSize(i);
            const opacity = getOpacity(i);
            const isActive = i === currentIndex;
            const isPlaceholder = cone.id === 'temp' && (cone as any).is_analyzed === 0;

            return (
              <div
                key={cone.id}
                data-carousel-item={i}
                className="flex-shrink-0 group"
                style={{
                  width: size,
                  height: size,
                  opacity,
                  cursor: 'pointer',
                  zIndex: isActive ? 10 : 1,
                  position: 'relative',
                }}
                onClick={() => {
                  if (isPlaceholder) {
                    onOpenProfile(cone, i);
                  } else if (isDesktop) {
                    // Desktop: clicking any cone immediately opens its profile,
                    // and preserve the current scroll position for when we return.
                    const el = containerRef.current;
                    if (el) {
                      sessionStorage.setItem('cones_return_scroll', String(el.scrollLeft));
                    }
                    onOpenProfile(cone, i);
                  } else if (isActive) {
                    onOpenProfile(cone, i);
                  } else {
                    onChange(i);
                  }
                }}
              >
                {/* Desktop: cone index label above top-left corner, e.g. (01) */}
                <span className="hidden md:block absolute -top-4 left-0 text-[9px] text-black">
                  ({String(cone.index).padStart(2, '0')})
                </span>
                <div className="w-full h-full overflow-hidden bg-gray-50 relative">
                  {cone.image_path && (
                    <img
                      src={cone.image_path}
                      alt={cone.description || 'Cone'}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  )}
                  {/* Desktop hover overlay: very slight white tint */}
                  <div className="hidden md:block absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
                </div>
              </div>
            );
          })}
          {/* Desktop spacer so the last cone doesn't stick to the right edge */}
          <div style={{ width: 40, height: desktopCardSize, flexShrink: 0 }} />
        </div>
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
            const isPlaceholder = cone.id === 'temp' && (cone as any).is_analyzed === 0;

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
                  if (isPlaceholder) {
                    onOpenProfile(cone, i);
                  } else if (isActive) {
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
  const [customColor, setCustomColor] = useState<string>('#ff0000');
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [cursorOnCone, setCursorOnCone] = useState(false);
  const [coneSize, setConeSize] = useState<number | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);

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
      const pt = getCanvasPoint(e);
      if (pt) setCursorOnCone(isOnCone(pt.x, pt.y));
      if (!isDrawingRef.current) return;
      e.preventDefault();
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
    setCursorOnCone(false);
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

  // Keep cone/canvas/buttons a fixed distance from bottom nav (mobile) or viewport bottom (desktop)
  useEffect(() => {
    const updateSize = () => {
      if (typeof window === 'undefined') return;
      const container = containerRef.current;
      if (!container) return;
      const wrapper = container.parentElement as HTMLElement | null;
      if (!wrapper) return;

      const wrapperRect = wrapper.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isDesktop = window.innerWidth >= 768;

      let bottomLimit: number;
      if (isDesktop) {
        // 40px gap above bottom of viewport
        bottomLimit = viewportHeight - 40;
      } else {
        const bottomNav = document.querySelector<HTMLElement>('nav[data-cones-bottom-nav="1"]');
        const navRect = bottomNav?.getBoundingClientRect();
        const navTop = navRect ? navRect.top : viewportHeight;
        // 20px gap above bottom nav
        bottomLimit = navTop - 20;
      }

      const nonConeHeight = wrapperRect.height - containerRect.height;
      const availableForWrapper = bottomLimit - wrapperRect.top;
      const availableForCone = availableForWrapper - nonConeHeight;
      if (availableForCone <= 0) return;

      const maxWidth = wrapper.clientWidth;
      const idealMax = isDesktop ? 640 : 440;
      const size = Math.max(0, Math.min(availableForCone, maxWidth, idealMax));
      setConeSize(size);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="flex-1 flex flex-col px-6 pt-6 pb-0 md:pb-6">
      <img
        ref={coneImageRef}
        src="/cone-info.png"
        alt=""
        className="hidden"
        crossOrigin="anonymous"
        onLoad={() => setImageLoaded(true)}
      />

      <div className="w-full max-w-[960px] mx-auto flex flex-col gap-8 md:gap-10">
        {/* Mobile intro text (desktop version lives in top nav) */}
        <p className="block md:hidden text-[10px] font-normal leading-tight text-gray-800 text-left w-2/3">
          I’ve always felt a strange connection to traffic cones. Not for any practical reason,
          just the way they exist. Some stand alone, some gather in groups, some stay put for
          weeks while others appear somewhere new every day. There&apos;s something quietly
          human about them.
          <br />
          <br />
          So this is my small tribute to them. Upload a cone, receive its personality profile and
          a song that matches its vibe. Every cone has a story.
        </p>

        <div className="flex flex-col items-center gap-4 md:gap-5 mt-8 md:mt-16 mb-0">
          <div
            ref={containerRef}
            className="relative w-full max-w-[440px] md:max-w-[640px] aspect-square touch-none select-none"
            style={{
              touchAction: 'none',
              width: coneSize ?? undefined,
              height: coneSize ?? undefined,
              maxWidth: '100%',
            }}
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
              className="absolute inset-0 w-full h-full"
              style={{ touchAction: 'none', cursor: cursorOnCone ? 'crosshair' : 'default' }}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            {/* Color palette */}
            <div className="flex items-center gap-1.5">
              {['#000000', '#0C2FAB', '#FCD142', '#ffffff'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setStrokeColor(c)}
                  className="w-3 h-3 rounded-full border cursor-pointer"
                  style={{
                    backgroundColor: c,
                    borderColor: strokeColor === c ? '#111' : '#d4d4d4',
                  }}
                />
              ))}
              {/* Custom color picker */}
              <button
                type="button"
                className="relative w-3 h-3 rounded-full cursor-pointer flex items-center justify-center text-[10px] leading-none"
                style={{
                  border: 'none',
                  backgroundColor: strokeColor === customColor ? customColor : 'transparent',
                  color: '#555',
                }}
              >
                {strokeColor === customColor ? '' : '+'}
                <input
                  ref={colorInputRef}
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={customColor}
                  onFocus={() => setStrokeColor(customColor)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomColor(val);
                    setStrokeColor(val);
                  }}
                />
              </button>
            </div>

            {/* Undo / Clear / Redo row (visible only after drawing) */}
            <div className="flex items-center justify-center gap-5 h-7">
              {hasDrawn && (
                <>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center select-none text-[11px] md:text-[12px]"
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
                    className="text-[10px] md:text-[11px] uppercase text-gray-400 hover:text-gray-600 cursor-pointer select-none"
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.preventDefault()}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center select-none text-[11px] md:text-[12px]"
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
  const MIN_CROP_SCALE = 1;
  const [cropScale, setCropScale] = useState(MIN_CROP_SCALE);
  const [cropTranslate, setCropTranslate] = useState({ x: 0, y: 0 });
  const cropGestureRef = useRef<{
    startX: number; startY: number; baseTx: number; baseTy: number;
    pinchStartDist?: number; pinchBaseScale?: number;
  } | null>(null);
  const cropNaturalRef = useRef<{ w: number; h: number } | null>(null);
  const [cropNatural, setCropNatural] = useState<{ w: number; h: number } | null>(null);
  const [cropContainerSize, setCropContainerSize] = useState(300);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const undoStackRef = useRef<Cone[]>([]);
  const redoStackRef = useRef<Cone[]>([]);
  const pendingRestoreIndexRef = useRef<number | null>(null);
  const hasCachedConesRef = useRef(false);
  const isCroppingRef = useRef(false);
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
      const returnScroll = sessionStorage.getItem('cones_return_scroll');
      if (returnIndex != null && returnFilter) {
        setFilter(returnFilter as 'all' | 'mine');
        pendingRestoreIndexRef.current = parseInt(returnIndex, 10);
        if (returnView === 'index') {
          setViewMode('index');
          setReturnScrollIndex(parseInt(returnIndex, 10));
          sessionStorage.removeItem('cones_return_view');
        }
        if (returnScroll != null) {
          pendingRestoreScrollRef.current = parseFloat(returnScroll);
        }
        sessionStorage.removeItem('cones_return_index');
        sessionStorage.removeItem('cones_return_filter');
        sessionStorage.removeItem('cones_return_scroll');
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
            // Don't clear pendingRestoreIndexRef here — let useEffect([displayCones.length])
            // handle the desktop scroll restore after the carousel DOM is committed.
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
  const pendingRestoreScrollRef = useRef<number | null>(null);

  // When uploading a new cone and analysis is in progress (or the analyzing screen was closed),
  // append a placeholder cone at the end of the carousel so it can be centered and re-opened.
  const carouselCones = useMemo(() => {
    if (
      isUploading &&
      lastUploadedCone &&
      !displayCones.some((c) => c.id === lastUploadedCone.id)
    ) {
      return [...displayCones, lastUploadedCone];
    }
    return displayCones;
  }, [displayCones, isUploading, lastUploadedCone]);

  useEffect(() => {
    if (sessionId) fetchCones(filter, sessionId);
  }, [sessionId, filter, fetchCones]);

  // Restore carousel index/scroll when returning from cone profile (after cones are loaded)
  useEffect(() => {
    if (displayCones.length > 0 && pendingRestoreIndexRef.current !== null) {
      const idx = Math.min(
        Math.max(0, pendingRestoreIndexRef.current),
        displayCones.length - 1
      );
      setCurrentIndex(idx);
      setRestoreInstant(true);
      pendingRestoreIndexRef.current = null;

      // Desktop: if we captured an exact scrollLeft before navigating to profile,
      // restore that precise scroll position; otherwise fall back to aligning
      // based on the restored index.
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        const carousel = document.querySelector<HTMLElement>('[data-carousel-root="1"]');
        if (carousel) {
          const saved = pendingRestoreScrollRef.current;
          if (typeof saved === 'number' && !Number.isNaN(saved)) {
            carousel.scrollLeft = saved;
          } else {
            const first = carousel.querySelector<HTMLElement>('[data-carousel-item="0"]');
            const second = carousel.querySelector<HTMLElement>('[data-carousel-item="1"]');
            let cardStride = first?.offsetWidth ?? 0;
            if (first && second) {
              cardStride = second.offsetLeft - first.offsetLeft;
            }
            if (cardStride > 0) {
              carousel.scrollLeft = idx * cardStride;
            }
          }
        }
        pendingRestoreScrollRef.current = null;
      }
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
    const SNAP_COOLDOWN = 900; // treat the entire swipe gesture (even long ones) as a single step
    const THRESHOLD = 0.5; // treat even very light horizontal swipe as intent to move

    const handleWheel = (e: WheelEvent) => {
      if (!isDesktop) return;
      if (isCroppingRef.current) return;

      const primaryDelta =
        Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(primaryDelta) < THRESHOLD) return;

      // In desktop list view, map any swipe (horizontal or vertical) anywhere on the
      // page to smooth horizontal scroll on the carousel instead of index-stepping.
      if (viewMode === 'list') {
        const carousel = document.querySelector<HTMLElement>('[data-carousel-root=\"1\"]');
        if (!carousel) return;
        e.preventDefault();
        e.stopPropagation();
        // Use the dominant wheel axis to drive horizontal scroll.
        carousel.scrollLeft += primaryDelta;
        return;
      }

      // In other desktop views, only react to clearly horizontal gestures and keep
      // discrete index steps.
      const isHorizontal =
        Math.abs(e.deltaX) >= Math.abs(e.deltaY) || Math.abs(e.deltaX) > 1;
      if (!isHorizontal) return;

      e.preventDefault();
      e.stopPropagation();

      if (pageSteppedRef.current) return;

      const now = Date.now();
      const dir = primaryDelta > 0 ? 1 : -1;
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
      // For any horizontal-leaning swipe, aggressively prevent browser navigation gesture
      if (dx > dy && dx > 2) {
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
    // Center the placeholder cone at the end of the carousel while analysis runs.
    setCurrentIndex(displayCones.length);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('session_id', sessionId);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) console.error('[upload] analysis error:', data.error);
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
          // On close, return carousel to new cone; restore index view if user was in it
          sessionStorage.setItem('cones_return_index', String(arrayIndex));
          sessionStorage.setItem('cones_return_filter', 'mine');
          if (viewMode === 'index') {
            sessionStorage.setItem('cones_return_view', 'index');
          }
          const carousel = document.querySelector<HTMLElement>('[data-carousel-root=\"1\"]');
          if (carousel) {
            sessionStorage.setItem('cones_return_scroll', String(carousel.scrollLeft));
          }
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
    // Start at base cover scale (no extra zoom); longer side overflows square.
    setCropScale(MIN_CROP_SCALE);
    setCropTranslate({ x: 0, y: 0 });
    cropNaturalRef.current = null;
    setCropNatural(null);
    setCropContainerSize(300);
    isCroppingRef.current = true; setIsCropping(true);
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

    // Match the on-screen preview: image fills the square (cover),
    // and userScale corresponds to additional zoom applied on top.
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
    const nat = cropNaturalRef.current;
    if (!nat) return { maxPanX: 0, maxPanY: 0 };
    const { w, h } = nat;
    const baseCoverScale = Math.max(containerSize / w, containerSize / h);
    const scaledW = w * baseCoverScale * s;
    const scaledH = h * baseCoverScale * s;
    const maxPanX = Math.max(0, (scaledW - containerSize) / 2);
    const maxPanY = Math.max(0, (scaledH - containerSize) / 2);
    return { maxPanX, maxPanY };
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
      const newScale = Math.max(MIN_CROP_SCALE, Math.min(5, g.pinchBaseScale * dist / g.pinchStartDist));
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
          const newScale = Math.max(MIN_CROP_SCALE, Math.min(5, prev * (1 - e.deltaY * 0.004)));
          const { maxPanX, maxPanY } = getCropMaxPan(containerSize, newScale);
          setCropTranslate(pt => ({
            x: Math.max(-maxPanX, Math.min(maxPanX, pt.x)),
            y: Math.max(-maxPanY, Math.min(maxPanY, pt.y)),
          }));
          return newScale;
        });
      } else {
        // Trackpad two-finger scroll = pan (both horizontally and vertically)
        setCropScale(prev => {
          const { maxPanX, maxPanY } = getCropMaxPan(containerSize, prev);
          setCropTranslate(pt => ({
            x: Math.max(-maxPanX, Math.min(maxPanX, pt.x - e.deltaX * 1.5)),
            y: Math.max(-maxPanY, Math.min(maxPanY, pt.y - e.deltaY * 1.5)),
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
      isCroppingRef.current = false; setIsCropping(false);
      setCropPreviewUrl(null);
      setPendingUploadFile(null);
      await uploadConeFile(cropped);
    } catch {
      // Fallback: try original file
      if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl);
      const original = pendingUploadFile;
      isCroppingRef.current = false; setIsCropping(false);
      setCropPreviewUrl(null);
      setPendingUploadFile(null);
      await uploadConeFile(original);
    }
  };

  const cancelCrop = () => {
    if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl);
    setCropPreviewUrl(null);
    setPendingUploadFile(null);
    isCroppingRef.current = false; setIsCropping(false);
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

  const scrollDesktopCarouselToIndex = useCallback(
    (idx: number, { smooth }: { smooth?: boolean } = {}) => {
      if (typeof window === 'undefined' || window.innerWidth < 768) return;
      const el = document.querySelector<HTMLElement>('[data-carousel-root="1"]');
      if (!el) return;
      const first = el.querySelector<HTMLElement>('[data-carousel-item="0"]');
      const second = el.querySelector<HTMLElement>('[data-carousel-item="1"]');
      let cardStride = first?.offsetWidth ?? 0;
      if (first && second) {
        cardStride = second.offsetLeft - first.offsetLeft;
      }
      if (!cardStride) return;
      // Padding on the inner flex container already gives us the 20px left inset.
      // So aligning index 0 to scrollLeft = 0 keeps that 20px gap at the start.
      const target = idx * cardStride;
      if (!smooth) {
        el.scrollLeft = target;
        return;
      }
      const start = el.scrollLeft;
      const distance = target - start;
      const duration = 420; // ms
      const startTime = performance.now();

      const ease = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        el.scrollLeft = start + distance * ease(t);
        if (t < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    },
    []
  );

  const handleShuffle = () => {
    if (displayCones.length === 0) return;
    let newIdx = currentIndex;
    while (newIdx === currentIndex && displayCones.length > 1) {
      newIdx = Math.floor(Math.random() * displayCones.length);
    }
    setCurrentIndex(newIdx);
    scrollDesktopCarouselToIndex(newIdx, { smooth: true });
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

  const activeCone = carouselCones[currentIndex] ?? null;
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
            ref={(el) => { cropContainerRef.current = el; if (el) setCropContainerSize(el.offsetWidth); }}
            className="w-full max-w-xs md:w-[300px] md:max-w-[300px] aspect-square bg-gray-100 overflow-hidden cursor-grab active:cursor-grabbing relative"
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
              className="pointer-events-none select-none"
              style={(() => {
                if (cropNatural && cropContainerSize > 0) {
                  const { w, h } = cropNatural;
                  const baseCoverScale = Math.max(cropContainerSize / w, cropContainerSize / h);
                  const totalScale = baseCoverScale * cropScale;
                  const rW = w * totalScale;
                  const rH = h * totalScale;
                  return {
                    position: 'absolute' as const,
                    width: rW,
                    height: rH,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    left: (cropContainerSize - rW) / 2 + cropTranslate.x,
                    top: (cropContainerSize - rH) / 2 + cropTranslate.y,
                  };
                }
                return { width: '100%', height: '100%', objectFit: 'cover' as const };
              })()}
              onLoad={(e) => {
                const el = e.currentTarget;
                const nat = { w: el.naturalWidth, h: el.naturalHeight };
                cropNaturalRef.current = nat;
                setCropNatural(nat);
                if (cropContainerRef.current) setCropContainerSize(cropContainerRef.current.offsetWidth);
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
      <header className="hidden md:grid md:grid-cols-[1fr_auto_1fr] items-start gap-4 px-5 pt-4 pb-2.5">
        <nav className="flex items-start gap-4 justify-self-start">
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

        <div className="flex justify-center items-start justify-self-center min-w-0">
          {activeTab === 'cones' ? (
            <div className="flex items-center gap-1.5">
              <FilterPills filter={filter} totalCount={totalCount} mineCount={mineCount} onFilter={setFilter} />
            </div>
          ) : (
            <p className="hidden md:block text-[11px] tracking-[-0.04em] leading-snug text-gray-800 text-left max-w-[500px]">
              I’ve always felt a strange connection to traffic cones. Not for any practical reason,
              just the way they exist. Some stand alone, some gather in groups, some stay put for
              weeks while others appear somewhere new every day. There&apos;s something quietly
              human about them.
              {' '}
              So this is my small tribute to them. Upload a cone, receive its personality profile and
              a song that matches its vibe. Every cone has a story.
            </p>
          )}
        </div>

        <div className="flex items-center gap-8 justify-self-end">
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
              const carousel = document.querySelector<HTMLElement>('[data-carousel-root=\"1\"]');
              if (carousel) {
                sessionStorage.setItem('cones_return_scroll', String(carousel.scrollLeft));
              }
              router.push(`/cones/${urlKey}${filter === 'mine' ? '?filter=mine' : ''}`);
            }}
          />
        ) : (
          <div
            ref={conesContentRef}
            className="flex-1 flex flex-col py-4 overflow-hidden justify-evenly md:justify-center md:relative"
          >
            {/* Info text / last uploaded cone (no thumbnail) — hide on desktop */}
            <div className="flex flex-col items-center text-center px-4 space-y-0.5 leading-none [&>p]:leading-tight md:hidden">
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
            <div className="md:-mt-24">
            <Carousel
              cones={carouselCones}
              currentIndex={currentIndex}
              onChange={setCurrentIndex}
              wheelDisabled={isDesktop}
              instantPosition={restoreInstant}
              onOpenProfile={(cone, index) => {
                // If this is the temporary placeholder cone for an in-progress upload,
                // re-open the analyzing screen instead of navigating to a profile page.
                if (cone.id === 'temp' && (cone as any).is_analyzed === 0 && lastUploadedCone) {
                  setAnalyzingCone(lastUploadedCone);
                  setActiveTab('cones');
                  return;
                }
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
            </div>

            {/* Shuffle button — desktop: with left/right arrows */}
            <div className="flex justify-center items-center gap-2 md:absolute md:bottom-8 md:left-0 md:right-0">
              {/* Arrows + shuffle */}
              <button
                type="button"
                aria-label="Previous cone"
                onClick={() => {
                  if (isDesktop) {
                    // Read actual scroll position so we step from where the carousel
                    // visually is, not from the (possibly stale) currentIndex state.
                    const carousel = document.querySelector<HTMLElement>('[data-carousel-root="1"]');
                    const first = carousel?.querySelector<HTMLElement>('[data-carousel-item="0"]');
                    const second = carousel?.querySelector<HTMLElement>('[data-carousel-item="1"]');
                    const stride = (first && second) ? second.offsetLeft - first.offsetLeft : 0;
                    const visibleIdx = stride > 0
                      ? Math.round((carousel?.scrollLeft ?? 0) / stride)
                      : currentIndex;
                    const next = Math.max(0, visibleIdx - 1);
                    setCurrentIndex(next);
                    scrollDesktopCarouselToIndex(next, { smooth: true });
                  } else {
                    setCurrentIndex((i) => Math.max(0, i - 1));
                  }
                }}
                disabled={carouselCones.length <= 1 || currentIndex === 0}
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
              {carouselCones.length > 1 ? (
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
                onClick={() => {
                  if (isDesktop) {
                    const carousel = document.querySelector<HTMLElement>('[data-carousel-root="1"]');
                    const first = carousel?.querySelector<HTMLElement>('[data-carousel-item="0"]');
                    const second = carousel?.querySelector<HTMLElement>('[data-carousel-item="1"]');
                    const stride = (first && second) ? second.offsetLeft - first.offsetLeft : 0;
                    const visibleIdx = stride > 0
                      ? Math.round((carousel?.scrollLeft ?? 0) / stride)
                      : currentIndex;
                    const next = Math.min(carouselCones.length - 1, visibleIdx + 1);
                    setCurrentIndex(next);
                    scrollDesktopCarouselToIndex(next, { smooth: true });
                  } else {
                    setCurrentIndex((i) => Math.min(carouselCones.length - 1, i + 1));
                  }
                }}
                disabled={carouselCones.length <= 1 || currentIndex === carouselCones.length - 1}
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
      <nav
        data-cones-bottom-nav="1"
        className="md:hidden sticky bottom-0 z-30 bg-white flex items-end justify-between px-6 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]"
      >
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
