import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { config, getMeetingType } from '@/lib/config';
import { freeSlots, ownerDay } from '@/lib/slots';
import { store, type Booking } from '@/lib/store';

const body = z.object({
  typeId: z.string(),
  start: z.string().datetime(),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  note: z.string().trim().max(500).default(''),
  tz: z.string().max(64).default('UTC'),
  website: z.string().max(0).optional(), // honeypot: real users leave it empty
});

async function notifyOwner(b: Booking) {
  const { RESEND_API_KEY, NOTIFY_EMAIL, FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) return;
  const type = getMeetingType(b.typeId);
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL ?? 'onboarding@resend.dev',
      to: NOTIFY_EMAIL,
      subject: `Rezervare nouă: ${type?.title ?? b.typeId} cu ${b.name}`,
      text: `${b.name} <${b.email}>\n${b.start} (${b.tz})\n\n${b.note}`,
    }),
  }).catch(() => undefined);
}

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Date invalide. Verifică numele și e-mailul.' }, { status: 400 });
  const input = parsed.data;

  const type = getMeetingType(input.typeId);
  if (!type) return NextResponse.json({ error: 'Tip de întâlnire necunoscut.' }, { status: 400 });

  // The start must be one of the currently free slots, so clients cannot invent times.
  const start = new Date(input.start);
  const day = ownerDay(start);
  const free = await freeSlots(day, type.minutes);
  if (!free.some((s) => new Date(s.start).getTime() === start.getTime())) {
    return NextResponse.json({ error: 'Intervalul nu mai este disponibil.' }, { status: 409 });
  }

  const booking: Booking = {
    id: randomUUID(),
    typeId: type.id,
    start: start.toISOString(),
    end: new Date(start.getTime() + type.minutes * 60_000).toISOString(),
    day,
    name: input.name,
    email: input.email,
    note: input.note,
    tz: input.tz,
    createdAt: new Date().toISOString(),
  };

  if (!(await store.create(booking))) {
    return NextResponse.json({ error: 'Cineva tocmai a rezervat acest interval.' }, { status: 409 });
  }
  await notifyOwner(booking);
  return NextResponse.json({ booking: { id: booking.id, start: booking.start, end: booking.end, typeId: booking.typeId, owner: config.ownerName } });
}
