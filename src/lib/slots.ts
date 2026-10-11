import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { config } from './config';
import { overlaps, store } from './store';

export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function ownerDay(date: Date): string {
  return formatInTimeZone(date, config.timezone, 'yyyy-MM-dd');
}

/** All slots the owner offers on a given day (owner timezone), before removing booked ones. */
export function candidateSlots(day: string, minutes: number, now = new Date()) {
  const dow = new Date(`${day}T12:00:00Z`).getUTCDay();
  const windows = config.weekly[dow] ?? [];
  const earliest = now.getTime() + config.minNoticeHours * 3_600_000;
  const latest = now.getTime() + config.maxDaysAhead * 86_400_000;
  const out: { start: string; end: string }[] = [];

  for (const [from, to] of windows) {
    const windowStart = fromZonedTime(`${day}T${from}:00`, config.timezone).getTime();
    const windowEnd = fromZonedTime(`${day}T${to}:00`, config.timezone).getTime();
    for (let t = windowStart; t + minutes * 60_000 <= windowEnd; t += config.stepMinutes * 60_000) {
      if (t < earliest || t > latest) continue;
      out.push({ start: new Date(t).toISOString(), end: new Date(t + minutes * 60_000).toISOString() });
    }
  }
  return out;
}

export async function freeSlots(day: string, minutes: number) {
  const booked = await store.listByDay(day);
  return candidateSlots(day, minutes).filter((slot) => !booked.some((b) => overlaps(slot, b)));
}
