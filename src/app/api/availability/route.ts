import { NextResponse } from 'next/server';
import { getMeetingType } from '@/lib/config';
import { freeSlots } from '@/lib/slots';

export const dynamic = 'force-dynamic';

/** GET /api/availability?type=interview&month=2026-10 -> number of free slots per day. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = getMeetingType(searchParams.get('type') ?? '');
  const month = searchParams.get('month') ?? '';
  if (!type || !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days: Record<string, number> = {};

  await Promise.all(
    Array.from({ length: daysInMonth }, (_, i) => {
      const day = `${month}-${String(i + 1).padStart(2, '0')}`;
      return freeSlots(day, type.minutes).then((slots) => {
        if (slots.length) days[day] = slots.length;
      });
    }),
  );
  return NextResponse.json({ days });
}
