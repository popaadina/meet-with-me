'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// [hour, top colour, bottom colour]
const KEYS: [number, string, string][] = [
  [0, '#0b1026', '#1b2455'],
  [5, '#1b2455', '#6a4c93'],
  [7, '#4a78c2', '#f6b97a'],
  [12, '#3f8fe0', '#bfe3ff'],
  [17, '#4d6fc0', '#ffb56b'],
  [20, '#2a2a66', '#c2527a'],
  [24, '#0b1026', '#1b2455'],
];

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [hex(a), hex(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
};

function palette(hour: number) {
  const i = KEYS.findIndex(([h]) => h > hour);
  const [h0, t0, b0] = KEYS[i - 1];
  const [h1, t1, b1] = KEYS[i];
  const t = (hour - h0) / (h1 - h0);
  return { top: mix(t0, t1, t), bottom: mix(b0, b1, t) };
}

function nightFactor(h: number) {
  if (h < 5.5 || h > 20) return 1;
  if (h < 7.5) return (7.5 - h) / 2;
  if (h > 18) return (h - 18) / 2;
  return 0;
}

/** Sky whose colours, sun/moon and stars follow the hour (0-24) of the slot you point at. */
export function Sky({ hour }: { hour: number }) {
  const { top, bottom } = palette(Math.min(Math.max(hour, 0), 23.99));
  const night = nightFactor(hour);
  const isDay = hour >= 6 && hour < 19;
  const p = isDay ? (hour - 6) / 13 : (((hour - 19 + 24) % 24) / 11);
  const left = 8 + p * 84;
  const topPct = 62 - 48 * Math.sin(Math.PI * Math.min(Math.max(p, 0), 1));

  const stars = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({ left: (i * 37) % 100, top: (i * 53) % 65, size: 1 + (i % 3), delay: (i % 7) * 0.4 })),
    [],
  );

  return (
    <motion.div className="sky" aria-hidden animate={{ '--top': top, '--bottom': bottom } as never} transition={{ duration: 0.8 }}>
      <div className="stars" style={{ opacity: night }}>
        {stars.map((s, i) => (
          <span key={i} style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
        ))}
      </div>
      <motion.div
        className={isDay ? 'sun' : 'moon'}
        animate={{ left: `${left}%`, top: `${topPct}%` }}
        transition={{ type: 'spring', stiffness: 40, damping: 14 }}
      />
      <div className="hills" />
    </motion.div>
  );
}
