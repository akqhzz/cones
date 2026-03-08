'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ConeProfile from '@/components/ConeProfile';
import type { Cone } from '@/lib/db';

export default function ConePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const indexParam = typeof params.id === 'string' ? params.id : null;
  const filter = searchParams.get('filter') === 'mine' ? 'mine' : 'all';
  const [cone, setCone] = useState<Cone | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const sid = typeof window !== 'undefined' ? localStorage.getItem('cones_session_id') ?? '' : '';
    setSessionId(sid);
  }, []);

  useEffect(() => {
    const index = indexParam === null ? NaN : parseInt(indexParam, 10);
    if (indexParam === null || !Number.isInteger(index) || index < 0) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    const sid = typeof window !== 'undefined' ? localStorage.getItem('cones_session_id') ?? '' : '';
    fetch(`/api/cones?filter=${filter}&session_id=${encodeURIComponent(sid)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: Cone[] = (data.cones ?? []).sort(
          (a: Cone, b: Cone) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const c = list[index];
        if (c) setCone(c);
        else setNotFound(true);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [indexParam, filter]);

  const handleDelete = async () => {
    if (!cone || !sessionId) return;
    const res = await fetch(
      `/api/cones/${cone.id}?session_id=${encodeURIComponent(sessionId)}`,
      { method: 'DELETE' }
    );
    if (res.ok) router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-[10px] uppercase text-gray-400">Loading...</p>
      </div>
    );
  }

  if (notFound || !cone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white p-6">
        <p className="text-[10px] uppercase text-gray-500">Cone not found</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-[9px] bg-black text-white rounded-full px-4 py-1.5 h-6 uppercase hover:bg-gray-800 cursor-pointer"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <ConeProfile
      cone={cone}
      isOwn={cone.session_id === sessionId}
      isInMine={cone.session_id === sessionId}
      onClose={() => router.back()}
      onDelete={handleDelete}
    />
  );
}
