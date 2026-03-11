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
  const [displayCount, setDisplayCount] = useState<number | null>(null);
  const [displayCones, setDisplayCones] = useState<Cone[] | null>(null);

  useEffect(() => {
    const sid = typeof window !== 'undefined' ? localStorage.getItem('cones_session_id') ?? '' : '';
    setSessionId(sid);
  }, []);

  useEffect(() => {
    const idParam = indexParam ?? '';
    const idNum = parseInt(idParam, 10);
    const isNumericId = /^\d+$/.test(idParam) && Number.isInteger(idNum) && idNum >= 1;

    if (indexParam === null || indexParam === '') {
      setLoading(false);
      setNotFound(true);
      return;
    }

    // Restore from sessionStorage so nav bar never disappears on prev/next (after router.replace)
    if (isNumericId && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('cones_display_list');
        if (stored) {
          const list = JSON.parse(stored) as Cone[];
          const c = list[idNum - 1];
          if (c) {
            setDisplayCones(list);
            setCone(c);
            setDisplayCount(list.length);
            setLoading(false);
            setNotFound(false);
            sessionStorage.setItem('cones_return_index', String(idNum - 1));
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    // Client-side prev/next: we already have the list in state, just switch cone (no loading, nav stays)
    if (isNumericId && displayCones && displayCones[idNum - 1]) {
      setCone(displayCones[idNum - 1]);
      setDisplayCount(displayCones.length);
      setLoading(false);
      setNotFound(false);
      if (typeof window !== 'undefined') sessionStorage.setItem('cones_return_index', String(idNum - 1));
      return;
    }

    // Instant show: use cone passed from carousel via sessionStorage (same URL key)
    if (typeof window !== 'undefined') {
      try {
        const key = sessionStorage.getItem('cones_profile_key');
        const cached = sessionStorage.getItem('cones_profile_cone');
          if (key === idParam && cached) {
          const c = JSON.parse(cached) as Cone;
          sessionStorage.removeItem('cones_profile_key');
          sessionStorage.removeItem('cones_profile_cone');
          setCone(c);
          setLoading(false);
          setNotFound(false);
          // Still fetch in background to refresh
          if (isNumericId) {
            const arrayIndex = idNum - 1;
            const sid = localStorage.getItem('cones_session_id') ?? '';
            fetch(`/api/cones?filter=${filter}&session_id=${encodeURIComponent(sid)}`)
              .then((res) => res.json())
              .then((data) => {
                const list: Cone[] = (data.cones ?? []).sort(
                  (a: Cone, b: Cone) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                const displayCones = list.filter((c: Cone) => !c.is_impostor);
                setDisplayCount(displayCones.length);
                setDisplayCones(displayCones);
                const fresh = displayCones[arrayIndex];
                if (fresh) setCone(fresh);
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('cones_display_list', JSON.stringify(displayCones));
                  sessionStorage.setItem('cones_return_index', String(arrayIndex));
                }
              })
              .catch(() => {});
          } else {
            fetch(`/api/cones/${encodeURIComponent(idParam)}`)
              .then((res) => res.ok ? res.json() : Promise.reject(new Error('Not found')))
              .then((fresh: Cone) => setCone(fresh))
              .catch(() => {});
          }
          return;
        }
      } catch {
        // ignore parse error, fall through to fetch
      }
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    if (isNumericId) {
      // 1-based index into displayCones: /cones/1, /cones/2, ...
      const arrayIndex = idNum - 1;
      const sid = typeof window !== 'undefined' ? localStorage.getItem('cones_session_id') ?? '' : '';
      fetch(`/api/cones?filter=${filter}&session_id=${encodeURIComponent(sid)}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          const list: Cone[] = (data.cones ?? []).sort(
            (a: Cone, b: Cone) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          const displayCones = list.filter((c: Cone) => !c.is_impostor);
          const c = displayCones[arrayIndex];
          if (c) {
            setCone(c);
            setDisplayCount(displayCones.length);
            setDisplayCones(displayCones);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('cones_display_list', JSON.stringify(displayCones));
              sessionStorage.setItem('cones_return_index', String(arrayIndex));
            }
          } else setNotFound(true);
        })
        .catch(() => {
          if (!cancelled) setNotFound(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      // Cone by id (e.g. after upload impostor): /cones/[uuid]
      fetch(`/api/cones/${encodeURIComponent(idParam)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then((c: Cone) => {
          if (cancelled) return;
          setCone(c);
          setDisplayCount(null); // no prev/next when viewing by id
        })
        .catch(() => {
          if (!cancelled) setNotFound(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => { cancelled = true; };
  }, [indexParam, filter]);

  const handleDelete = async () => {
    if (!cone || !sessionId) return;
    // Compute new center index for carousel after deletion when returning home
    if (typeof window !== 'undefined' && indexParam && /^\d+$/.test(indexParam) && displayCount != null) {
      const n = parseInt(indexParam, 10); // 1-based
      let newIndex0 = 0;
      if (displayCount > 1) {
        if (n > 1) {
          // Prefer previous cone
          newIndex0 = n - 2;
        } else {
          // No previous, use next
          newIndex0 = 0;
        }
      } else {
        newIndex0 = 0;
      }
      window.sessionStorage.setItem('cones_return_index', String(newIndex0));
      window.sessionStorage.setItem('cones_return_filter', filter);
    }

    // Store last deleted cone so home page can offer undo toast
    if (typeof window !== 'undefined') {
      try {
        // Clear any cached display list/profile so we don't show a deleted cone
        window.sessionStorage.removeItem('cones_display_list');
        window.sessionStorage.removeItem('cones_profile_key');
        window.sessionStorage.removeItem('cones_profile_cone');
        window.sessionStorage.setItem('cones_last_deleted_cone', JSON.stringify(cone));
      } catch {
        // ignore
      }
    }

    const res = await fetch(
      `/api/cones/${cone.id}?session_id=${encodeURIComponent(sessionId)}`,
      { method: 'DELETE' }
    );
    if (res.ok) router.push('/');
  };

  // Ensure browser back swipe behaves like tapping CLOSE
  useEffect(() => {
    const onPopState = () => {
      // Mirror the close button behavior
      router.push(`/${filter === 'mine' ? '?filter=mine' : ''}`);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', onPopState);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', onPopState);
      }
    };
  }, [router, filter]);

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
      onClose={() => {
        // Always return directly to main cones view; ConesApp decides list vs index based on sessionStorage
        router.push(`/${filter === 'mine' ? '?filter=mine' : ''}`);
      }}
      onDelete={handleDelete}
      onPrevious={
        indexParam && /^\d+$/.test(indexParam) && displayCones
          ? () => {
              const newId = parseInt(indexParam, 10) - 1;
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('cones_display_list', JSON.stringify(displayCones));
                sessionStorage.setItem('cones_return_index', String(newId - 1));
              }
              router.replace(`/cones/${newId}${filter === 'mine' ? '?filter=mine' : ''}`);
            }
          : undefined
      }
      onNext={
        indexParam && /^\d+$/.test(indexParam) && displayCones
          ? () => {
              const newId = parseInt(indexParam, 10) + 1;
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('cones_display_list', JSON.stringify(displayCones));
                sessionStorage.setItem('cones_return_index', String(newId - 1));
              }
              router.replace(`/cones/${newId}${filter === 'mine' ? '?filter=mine' : ''}`);
            }
          : undefined
      }
      hasPrevious={indexParam != null && /^\d+$/.test(indexParam) && parseInt(indexParam, 10) > 1}
      hasNext={
        displayCount != null &&
        indexParam != null &&
        /^\d+$/.test(indexParam) &&
        parseInt(indexParam, 10) < displayCount
      }
    />
  );
}
