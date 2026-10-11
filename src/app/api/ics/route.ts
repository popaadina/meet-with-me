import { buildIcs } from '@/lib/ics';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** GET /api/ics?id=<booking id> -> calendar file. The random id acts as the capability. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const booking = id ? await store.get(id) : null;
  if (!booking) return new Response('Not found', { status: 404 });
  return new Response(buildIcs(booking), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="intalnire.ics"',
    },
  });
}
