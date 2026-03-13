import { NextRequest, NextResponse } from 'next/server';
import { getAllCones, getMyCones } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') ?? 'all';
  const sessionId = searchParams.get('session_id') ?? '';

  const [allCones, myCones] = await Promise.all([
    getAllCones(),
    sessionId ? getMyCones(sessionId) : Promise.resolve([] as Awaited<ReturnType<typeof getMyCones>>),
  ]);
  const cones = filter === 'mine' && sessionId ? myCones : allCones;
  // Counts reflect real cones only (exclude impostors), matching the carousel
  const total = allCones.filter((c) => !c.is_impostor).length;
  const totalMine = myCones.filter((c) => !c.is_impostor).length;

  return NextResponse.json({ cones, total, totalMine });
}
