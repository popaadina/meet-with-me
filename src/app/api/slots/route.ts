import { NextResponse } from 'next/server';
import { getMeetingType } from '@/lib/config';
import { DAY_RE, freeSlots } from '@/lib/slots';

export const dynamic = 'force-dynamic';

/** GET /api/slots?type=interview&day=2026-10-14 -> free slot start times (ISO, UTC). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = getMeetingType(searchParams.get('type') ?? '');
  const day = searchParams.get('day') ?? '';
  if (!type || !DAY_RE.test(day)) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });

  const slots = await freeSlots(day, type.minutes);
  return NextResponse.json({ slots: slots.map((s) => s.start) });
}
