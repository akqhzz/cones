'use client';

import { useEffect, useRef, useState } from 'react';
import SpotifyEmbed from './SpotifyEmbed';
import type { Cone } from '@/lib/db';

interface ConeProfileProps {
  cone: Cone | null;
  isAnalyzing?: boolean;
  isOwn?: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

const BIG_FIVE = [
  { key: 'openness', label: 'Openness' },
  { key: 'conscientiousness', label: 'Conscientiousness' },
  { key: 'extraversion', label: 'Extraversion' },
  { key: 'agreeableness', label: 'Agreeableness' },
  { key: 'neuroticism', label: 'Neuroticism' },
] as const;

export default function ConeProfile({
  cone,
  isAnalyzing,
  isOwn,
  onClose,
  onDelete,
}: ConeProfileProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuRefDesktop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || menuRefDesktop.current?.contains(target)) return;
      setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  return (
    <div
      className="fixed inset-0 z-50 bg-white overflow-y-auto md:flex md:items-center md:justify-center md:overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof window !== 'undefined' && window.innerWidth >= 768) {
          onClose();
        }
      }}
    >
      {/*
        Mobile: card fills screen with sticky footer inside.
        Desktop: card + close button below card, both in viewport.
      */}
      <div
        className="relative w-full flex flex-col min-h-screen md:min-h-0 md:flex md:flex-col md:items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex flex-col min-h-screen md:min-h-0 md:w-[460px] md:max-h-[92vh] md:overflow-y-auto md:border md:border-gray-200">

        {/* Scrollable content */}
        <div className="flex-1">
          {isAnalyzing && !cone?.is_analyzed ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="analyzing-spinner" />
              <p className="text-[9px] uppercase">Analyzing cone...</p>
              <p className="text-[9px] text-gray-400 mt-1">Close to continue in background</p>
            </div>

          ) : cone?.is_impostor ? (
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
                  <p className="text-[9px] mb-2">(Cone No.{cone.index})</p>
                  <div className="w-28 h-28 overflow-hidden bg-gray-50 flex-shrink-0">
                    <img
                      src={cone.image_path}
                      alt={cone.description || 'Cone'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {cone.location && (
                    <p className="text-[9px] text-gray-400 mt-2">
                      {cone.location}{formattedDate ? `, ${formattedDate}` : ''}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[9px] mb-2">Cone&apos;s Song</p>
                  {cone.spotify_track_id ? (
                    <SpotifyEmbed trackId={cone.spotify_track_id} />
                  ) : cone.song_title ? (
                    <div className="border border-gray-100 p-3 bg-gray-50">
                      <p className="text-[10px] leading-tight">{cone.song_title}</p>
                      <p className="text-[9px] text-gray-400 mt-1">{cone.song_artist}</p>
                    </div>
                  ) : (
                    <div className="border border-gray-100 p-3 bg-gray-50">
                      <p className="text-[9px] text-gray-400">No song found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* More space before About */}
              <div className="border-t border-gray-100 mx-5 mt-2" />

              {/* About */}
              <div className="grid grid-cols-2 gap-0.5 px-5 py-2.5">
                <p className="text-[10px] uppercase">About This Cone</p>
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
                  <p className="text-[10px] uppercase">Big Five</p>
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

        {/* Footer — mobile only: sticky at viewport bottom */}
        <div className="sticky bottom-0 bg-white flex items-center justify-center gap-2 py-3 pb-safe md:hidden">
          {isOwn && onDelete && cone && !isAnalyzing && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="text-[9px] bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
              >
                •••
              </button>
              {showMenu && (
                <div className="absolute bottom-full mb-2 left-0 border border-gray-200 bg-white shadow-sm">
                  <button
                    onClick={() => { setShowMenu(false); onDelete(); }}
                    className="block w-full text-left px-4 py-2 text-[10px] hover:bg-gray-50 whitespace-nowrap cursor-pointer"
                  >
                    Delete cone
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="text-[9px] bg-gray-100 rounded-full px-4 py-1.5 hover:bg-gray-200 transition-colors uppercase cursor-pointer"
          >
            Close ×
          </button>
        </div>
      </div>

        {/* Desktop: close button below the card, in viewport */}
        <div className="hidden md:flex items-center justify-center gap-2 pt-4 pb-6">
          {isOwn && onDelete && cone && !isAnalyzing && (
            <div ref={menuRefDesktop} className="relative">
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="text-[9px] bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
              >
                •••
              </button>
              {showMenu && (
                <div className="absolute bottom-full mb-2 left-0 border border-gray-200 bg-white shadow-sm">
                  <button
                    onClick={() => { setShowMenu(false); onDelete(); }}
                    className="block w-full text-left px-4 py-2 text-[10px] hover:bg-gray-50 whitespace-nowrap cursor-pointer"
                  >
                    Delete cone
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="text-[9px] bg-gray-100 rounded-full px-4 py-1.5 hover:bg-gray-200 transition-colors uppercase cursor-pointer"
          >
            Close ×
          </button>
        </div>
      </div>
    </div>
  );
}
