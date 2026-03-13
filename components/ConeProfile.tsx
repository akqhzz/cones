'use client';

import { useEffect, useRef, useState } from 'react';
import BandcampEmbed from './BandcampEmbed';
import type { Cone } from '@/lib/db';

interface ConeProfileProps {
  cone: Cone | null;
  isAnalyzing?: boolean;
  isOwn?: boolean;
  isInMine?: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

// Order: SLOAN (Extraversion, Neuroticism, Conscientiousness, Agreeableness, Openness)
const BIG_FIVE = [
  { key: 'extraversion', label: 'Extraversion' },
  { key: 'neuroticism', label: 'Neuroticism' },
  { key: 'conscientiousness', label: 'Conscientiousness' },
  { key: 'agreeableness', label: 'Agreeableness' },
  { key: 'openness', label: 'Openness' },
] as const;

export default function ConeProfile({
  cone,
  isAnalyzing,
  isOwn,
  isInMine,
  onClose,
  onDelete,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: ConeProfileProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const confirmRefDesktop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (confirmRef.current?.contains(target) || confirmRefDesktop.current?.contains(target)) return;
      setShowDeleteConfirm(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const navButtonClass = 'text-[10px] bg-white text-black border border-gray-400 rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer leading-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white';

  const deleteButton = isInMine && cone && !isAnalyzing && onDelete && (
    <>
      <button
        type="button"
        onClick={() => setShowDeleteConfirm(true)}
        className={navButtonClass}
        aria-label="Delete cone"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
      {showDeleteConfirm && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 border border-gray-200 bg-white shadow-sm rounded overflow-hidden min-w-[140px]"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-2 text-[10px] text-gray-600 border-b border-gray-100">Delete this cone?</p>
          <div className="flex gap-2 p-2">
            <button
              type="button"
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              className="flex-1 text-[9px] uppercase bg-white text-black border border-gray-400 rounded-full py-1.5 h-6 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer leading-none border-red-300 text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 text-[9px] uppercase bg-white text-black border border-gray-200 rounded-full py-1.5 h-6 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer leading-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const formattedDate = cone?.created_at
    ? (() => {
        const d = new Date(cone.created_at);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(2);
        return `${mm}/${dd}/${yy}`;
      })()
    : '';

  // Show impostor view only when cone is marked as impostor
  const showAsImpostor = Boolean(cone?.is_impostor);

  return (
    <div
      className="fixed inset-0 z-50 bg-white overflow-hidden md:flex md:items-center md:justify-center"
      onClick={(e) => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768 && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/*
        Mobile: card fills screen with sticky footer inside.
        Desktop: inner is 460px so backdrop receives clicks on the sides; click backdrop to close.
      */}
      <div
        className="relative w-full h-full flex flex-col md:h-auto md:flex md:flex-col md:items-center md:w-[460px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full flex flex-col md:h-auto md:max-h-[92vh] md:overflow-y-auto md:border md:border-gray-200">

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isAnalyzing && !cone?.is_analyzed ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="analyzing-spinner" />
              <p className="text-[9px] uppercase">Analyzing cone...</p>
              <p className="text-[9px] text-gray-400 mt-1">Close to continue in background</p>
            </div>

          ) : showAsImpostor && cone ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
              {cone.image_path && (
                <img src={cone.image_path} alt="Impostor" className="w-28 h-28 object-cover grayscale opacity-50" />
              )}
              <div className="text-center">
                <p className="text-[9px] uppercase mb-3">Impostor Detected</p>
                <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed">
                  {cone.about || 'This is not a traffic cone. Only genuine cones are welcome in the archive.'}
                </p>
              </div>
            </div>

          ) : cone ? (
            <div>
              {/* Top: image + song */}
              <div className="grid grid-cols-2 gap-0.5 px-5 py-4">
                <div>
                  <p className="text-[9px] mb-2">(No.{cone.index}) {formattedDate}</p>
                  <div className="w-28 h-28 overflow-hidden bg-gray-50 flex-shrink-0">
                    <img
                      src={cone.image_path}
                      alt={cone.description || 'Cone'}
                      className="w-full h-full object-cover"
                    />
                  </div>
              {/*}
                  {formattedDate && (
                    <p className="text-[9px] text-gray-400 mt-2">
                      {formattedDate}
                    </p>
                  )} */}
                </div>
                <div>
                  <p className="text-[9px] mb-2">Cone&apos;s Song</p>
                  <BandcampEmbed
                    albumId={cone.bandcamp_album_id}
                    trackId={cone.bandcamp_track_id}
                    songUrl={cone.song_url}
                    songTitle={cone.song_title}
                    songArtist={cone.song_artist}
                  />
                </div>
              </div>

              {/* More space before About */}
              <div className="border-t border-gray-100 mx-5 mt-2" />

              {/* About */}
              <div className="grid grid-cols-2 gap-0.5 px-5 py-2.5">
                <p className="text-[10px] uppercase">
                  {cone.description || 'About This Cone'}
                </p>
                <p className="text-[10px] leading-snug">{cone.about}</p>
              </div>

              {/* Personality — generous top space, no line above */}
              <div className="px-5 pt-8 pb-2">
                <p className="text-[10px] uppercase">Personality</p>
              </div>
              <div className="border-t border-gray-100 mx-5" />

              {/* Big Five */}
              <div className="grid grid-cols-2 gap-0.5 px-5 py-1.5">
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] w-6 flex-shrink-0">(01)</span>
                  <p className="text-[10px] uppercase">
                    Big Five{cone.sloan ? ` - ${cone.sloan}` : ''}
                  </p>
                </div>
                <div className="space-y-1">
                  {BIG_FIVE.map(({ key, label }) => {
                    const val = cone[key as keyof Cone] as number | null;
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-[10px]">{label}</span>
                        <span className="text-[10px] tabular-nums">
                          {val != null ? `${val}%` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 mx-5 mt-2" />

              {/* Core Values */}
              <div className="grid grid-cols-2 gap-0.5 px-5 py-1.5">
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] w-6 flex-shrink-0">(02)</span>
                  <p className="text-[10px] uppercase">Core Values</p>
                </div>
                <div className="space-y-1">
                  {cone.core_values.map((v) => (
                    <p key={v} className="text-[10px]">{v}</p>
                  ))}
                </div>
              </div>

              <div className="h-4" />
            </div>
          ) : null}
        </div>

        {/* Footer — mobile: Prev, Delete, Close, Next */}
        <div className="flex-shrink-0 bg-white flex items-center justify-center gap-2 py-3 pb-safe md:hidden">
          <button
            type="button"
            aria-label="Previous cone"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className={navButtonClass}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          {deleteButton && <div ref={confirmRef} className="relative">{deleteButton}</div>}
          <button
            onClick={onClose}
            className="text-[10px] bg-white text-black border border-gray-400 rounded-full pl-3 pr-3 py-1.5 h-7 flex items-center gap-2 hover:bg-gray-100 transition-colors uppercase cursor-pointer leading-none"
          >
            Close{' '}
            <span className="text-[11px] font-medium leading-none inline-flex items-center justify-center text-gray-500">
              ×
            </span>
          </button>
          <button
            type="button"
            aria-label="Next cone"
            onClick={onNext}
            disabled={!hasNext}
            className={navButtonClass}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

        {/* Desktop: Prev, Delete, Close, Next */}
        <div className="hidden md:flex items-center justify-center gap-2 pt-4 pb-6">
          <button
            type="button"
            aria-label="Previous cone"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className={navButtonClass}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          {deleteButton && <div ref={confirmRefDesktop} className="relative">{deleteButton}</div>}
          <button
            onClick={onClose}
            className="text-[10px] bg-white text-black border border-gray-400 rounded-full pl-4 pr-3 py-1.5 h-7 flex items-center gap-2 hover:bg-gray-100 transition-colors uppercase cursor-pointer leading-none"
          >
            Close{' '}
            <span className="text-[11px] font-medium leading-none inline-flex items-center justify-center text-gray-500">
              ×
            </span>
          </button>
          <button
            type="button"
            aria-label="Next cone"
            onClick={onNext}
            disabled={!hasNext}
            className={navButtonClass}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
