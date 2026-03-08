import { NextRequest, NextResponse } from 'next/server';
import { restoreCone } from '@/lib/db';
import type { Cone } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const cone = body.cone as Cone | undefined;
  if (!cone?.id || !cone.session_id || !cone.image_path) {
    return NextResponse.json(
      { error: 'Missing cone data (id, session_id, image_path)' },
      { status: 400 }
    );
  }

  try {
    await restoreCone(cone);
    return NextResponse.json({ success: true, cone });
  } catch (err) {
    console.error('Restore cone error:', err);
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
  }
}
