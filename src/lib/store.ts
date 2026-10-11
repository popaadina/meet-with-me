import { promises as fs } from 'node:fs';
import path from 'node:path';

export type Booking = {
  id: string;
  typeId: string;
  start: string; // ISO UTC
  end: string; // ISO UTC
  day: string; // yyyy-MM-dd in the owner's timezone
  name: string;
  email: string;
  note: string;
  tz: string; // visitor timezone
  createdAt: string;
};

export interface Store {
  listByDay(day: string): Promise<Booking[]>;
  get(id: string): Promise<Booking | null>;
  /** Returns false when the slot overlaps an existing booking. */
  create(booking: Booking): Promise<boolean>;
}

export function overlaps(a: { start: string; end: string }, b: { start: string; end: string }) {
  return new Date(a.start).getTime() < new Date(b.end).getTime() && new Date(a.end).getTime() > new Date(b.start).getTime();
}

// ---- File store (local development) ----
const FILE = path.join(process.cwd(), '.data', 'bookings.json');
let chain: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Booking[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as Booking[];
  } catch {
    return [];
  }
}

function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

const fileStore: Store = {
  listByDay: async (day) => (await readAll()).filter((b) => b.day === day),
  get: async (id) => (await readAll()).find((b) => b.id === id) ?? null,
  create: (booking) =>
    serial(async () => {
      const all = await readAll();
      if (all.some((b) => b.day === booking.day && overlaps(b, booking))) return false;
      await fs.mkdir(path.dirname(FILE), { recursive: true });
      await fs.writeFile(FILE, JSON.stringify([...all, booking], null, 2));
      return true;
    }),
};

// ---- Upstash Redis store (production, via REST, no extra dependency) ----
async function redis(args: (string | number)[]): Promise<unknown> {
  const res = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(json.error);
  return json.result;
}

async function readDay(day: string): Promise<Booking[]> {
  const raw = (await redis(['GET', `day:${day}`])) as string | null;
  return raw ? (JSON.parse(raw) as Booking[]) : [];
}

const redisStore: Store = {
  listByDay: readDay,
  get: async (id) => {
    const raw = (await redis(['GET', `booking:${id}`])) as string | null;
    return raw ? (JSON.parse(raw) as Booking) : null;
  },
  create: async (booking) => {
    const lockKey = `lock:${booking.day}`;
    let locked = false;
    for (let i = 0; i < 10 && !locked; i++) {
      locked = (await redis(['SET', lockKey, '1', 'NX', 'EX', 10])) === 'OK';
      if (!locked) await new Promise((r) => setTimeout(r, 150));
    }
    if (!locked) throw new Error('Could not acquire booking lock');
    try {
      const existing = await readDay(booking.day);
      if (existing.some((b) => overlaps(b, booking))) return false;
      await redis(['SET', `day:${booking.day}`, JSON.stringify([...existing, booking])]);
      await redis(['SET', `booking:${booking.id}`, JSON.stringify(booking)]);
      return true;
    } finally {
      await redis(['DEL', lockKey]);
    }
  },
};

export const store: Store =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? redisStore : fileStore;
