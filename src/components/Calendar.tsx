'use client';

import { motion } from 'framer-motion';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];

type Props = {
  month: string; // yyyy-MM
  available: Record<string, number>;
  selected: string | null;
  loading: boolean;
  onSelect: (day: string) => void;
  onMonth: (delta: number) => void;
};

export function Calendar({ month, available, selected, loading, onSelect, onMonth }: Props) {
  const [y, m] = month.split('-').map(Number);
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();

  return (
    <div className="calendar">
      <div className="cal-head">
        <button type="button" onClick={() => onMonth(-1)} aria-label="Luna anterioară">‹</button>
        <h2>{MONTHS[m - 1]} {y}</h2>
        <button type="button" onClick={() => onMonth(1)} aria-label="Luna următoare">›</button>
      </div>
      <div className="cal-grid" role="grid" aria-busy={loading}>
        {WEEKDAYS.map((d, i) => <span key={i} className="cal-wd">{d}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const day = `${month}-${String(i + 1).padStart(2, '0')}`;
          const count = available[day] ?? 0;
          return (
            <motion.button
              key={day}
              type="button"
              disabled={!count}
              className={`cal-day${selected === day ? ' on' : ''}${count ? ' free' : ''}`}
              whileHover={count ? { scale: 1.12 } : undefined}
              whileTap={count ? { scale: 0.94 } : undefined}
              onClick={() => onSelect(day)}
              aria-label={count ? `${i + 1}, ${count} intervale libere` : `${i + 1}, indisponibil`}
            >
              {i + 1}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
