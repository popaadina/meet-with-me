// Everything you will want to personalise lives here.
export const config = {
  ownerName: 'Adina',
  tagline: 'Hai să vorbim. Alege un moment sub cerul care ți se potrivește.',
  timezone: 'Europe/Bucharest',
  meetingTypes: [
    { id: 'interview', title: 'Interviu', minutes: 30, blurb: 'Discuție despre rol, echipă și experiența mea.' },
    { id: 'coffee', title: 'Cafea virtuală', minutes: 15, blurb: 'Scurt și informal, să ne cunoaștem.' },
    { id: 'code', title: 'Cod împreună', minutes: 45, blurb: 'Pair programming sau review pe un exemplu real.' },
  ],
  // Day of week (0 = Sunday ... 6 = Saturday) -> [from, to] windows in the owner's timezone.
  weekly: {
    1: [['10:00', '13:00'], ['14:00', '17:00']],
    2: [['10:00', '13:00'], ['14:00', '17:00']],
    3: [['10:00', '13:00'], ['14:00', '17:00']],
    4: [['10:00', '13:00'], ['14:00', '17:00']],
    5: [['10:00', '14:00']],
  } as Record<number, string[][]>,
  stepMinutes: 15,
  minNoticeHours: 12,
  maxDaysAhead: 30,
} as const;

export type MeetingType = (typeof config.meetingTypes)[number];

export function getMeetingType(id: string): MeetingType | undefined {
  return config.meetingTypes.find((t) => t.id === id);
}
