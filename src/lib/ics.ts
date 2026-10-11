import { config, getMeetingType } from './config';
import type { Booking } from './store';

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function buildIcs(b: Booking): string {
  const type = getMeetingType(b.typeId);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//meet-with-me//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${b.id}@meet-with-me`,
    `DTSTAMP:${stamp(b.createdAt)}`,
    `DTSTART:${stamp(b.start)}`,
    `DTEND:${stamp(b.end)}`,
    `SUMMARY:${esc(`${type?.title ?? 'Întâlnire'} cu ${config.ownerName}`)}`,
    `DESCRIPTION:${esc(b.note || type?.blurb || '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
