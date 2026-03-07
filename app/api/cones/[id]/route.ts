import { NextRequest, NextResponse } from 'next/server';
import { getConeById, deleteCone } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cone = getConeById(params.id);
  if (!cone) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(cone);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id') ?? '';

  const cone = getConeById(params.id);
  if (!cone) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const deleted = deleteCone(params.id, sessionId);
  if (!deleted) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Remove image file
  try {
    const filePath = path.join(process.cwd(), 'public', cone.image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore file deletion errors
  }

  return NextResponse.json({ success: true });
}
