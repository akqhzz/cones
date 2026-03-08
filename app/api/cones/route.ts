import { NextRequest, NextResponse } from 'next/server';
import { getAllCones, getMyCones, countAllCones } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') ?? 'all';
  const sessionId = searchParams.get('session_id') ?? '';

  const cones = filter === 'mine' && sessionId
    ? await getMyCones(sessionId)
    : await getAllCones();

  const total = await countAllCones();
  const totalMine = sessionId ? (await getMyCones(sessionId)).length : 0;

  return NextResponse.json({ cones, total, totalMine });
}
