'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { formatInTimeZone } from 'date-fns-tz';
import { useEffect, useState, type FormEvent } from 'react';
import { Calendar } from '@/components/Calendar';
import { Sky } from '@/components/Sky';
import { config } from '@/lib/config';

type Booking = { id: string; start: string; end: string; typeId: string };

const hourOf = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
};

export default function Page() {
  const [tz, setTz] = useState('UTC');
  const [nowHour, setNowHour] = useState(12);
  const [typeId, setTypeId] = useState<string>(config.meetingTypes[0].id);
  const [month, setMonth] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState('');
  const [available, setAvailable] = useState<Record<string, number>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', note: '', website: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);

  const type = config.meetingTypes.find((t) => t.id === typeId)!;

  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    const now = new Date();
    setNowHour(now.getHours() + now.getMinutes() / 60);
    const m = formatInTimeZone(now, config.timezone, 'yyyy-MM');
    setMonth(m);
    setCurrentMonth(m);
  }, []);

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    setLoadingMonth(true);
    fetch(`/api/availability?type=${typeId}&month=${month}`)
      .then((r) => r.json())
      .then((j) => !cancelled && setAvailable(j.days ?? {}))
      .catch(() => !cancelled && setAvailable({}))
      .finally(() => !cancelled && setLoadingMonth(false));
    return () => {
      cancelled = true;
    };
  }, [month, typeId]);

  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    setSlots([]);
    fetch(`/api/slots?type=${typeId}&day=${day}`)
      .then((r) => r.json())
      .then((j) => !cancelled && setSlots(j.slots ?? []))
      .catch(() => !cancelled && setSlots([]));
    return () => {
      cancelled = true;
    };
  }, [day, typeId]);

  const time = (iso: string) => new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date(iso));
  const longDate = (iso: string) =>
    new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(new Date(iso));

  const shiftMonth = (delta: number) => {
    if (!month) return;
    const [y, m] = month.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
    if (next < currentMonth) return;
    setMonth(next);
    setDay(null);
    setSlot(null);
  };

  const pickType = (id: string) => {
    setTypeId(id);
    setDay(null);
    setSlot(null);
    setSlots([]);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typeId, start: slot, tz, ...form }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Ceva nu a mers. Încearcă din nou.');
        if (res.status === 409 && day) {
          setSlot(null);
          fetch(`/api/slots?type=${typeId}&day=${day}`).then((r) => r.json()).then((j) => setSlots(j.slots ?? []));
        }
        return;
      }
      setBooking(json.booking);
    } catch {
      setError('Nu pot ajunge la server. Verifică conexiunea și încearcă din nou.');
    } finally {
      setSubmitting(false);
    }
  }

  const reset = () => {
    setBooking(null);
    setSlot(null);
    setDay(null);
    setForm({ name: '', email: '', note: '', website: '' });
  };

  const skyHour = hover ? hourOf(hover) : slot ? hourOf(slot) : nowHour;

  return (
    <main>
      <Sky hour={skyHour} />
      <div className="wrap">
        <header>
          <h1>Hai să vorbim, {config.ownerName}</h1>
          <p>{config.tagline}</p>
        </header>

        <AnimatePresence mode="wait">
          {booking ? (
            <motion.section key="done" className="card ticket" initial={{ opacity: 0, y: 24, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0 }}>
              <p className="eyebrow">Confirmat</p>
              <h2>{config.meetingTypes.find((t) => t.id === booking.typeId)?.title}</h2>
              <p className="big">{longDate(booking.start)}</p>
              <p className="big">{time(booking.start)} – {time(booking.end)} <small>({tz})</small></p>
              <div className="actions">
                <a className="btn" href={`/api/ics?id=${booking.id}`}>Adaugă în calendar (.ics)</a>
                <button type="button" className="btn ghost" onClick={reset}>Rezervă altceva</button>
              </div>
            </motion.section>
          ) : (
            <motion.div key="flow" className="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <section className="card">
                <div className="types" role="radiogroup" aria-label="Tip de întâlnire">
                  {config.meetingTypes.map((t) => (
                    <button key={t.id} type="button" role="radio" aria-checked={t.id === typeId} className={`type${t.id === typeId ? ' on' : ''}`} onClick={() => pickType(t.id)}>
                      <strong>{t.title}</strong>
                      <span>{t.minutes} min</span>
                    </button>
                  ))}
                </div>
                <p className="blurb">{type.blurb}</p>
                {month && <Calendar month={month} available={available} selected={day} loading={loadingMonth} onSelect={(d) => { setDay(d); setSlot(null); }} onMonth={shiftMonth} />}
                <p className="hint">Orele sunt afișate în fusul tău orar ({tz}).</p>
              </section>

              <section className="card">
                <AnimatePresence mode="wait">
                  {!day ? (
                    <motion.p key="empty" className="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Alege o zi din calendar. Cerul se schimbă după ora pe care o ai în vedere.
                    </motion.p>
                  ) : (
                    <motion.div key={day} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <h2 className="day-title">{slots[0] ? longDate(slots[0]) : day}</h2>
                      <div className="slots" onMouseLeave={() => setHover(null)}>
                        {slots.length === 0 && <p className="hint">Se încarcă intervalele…</p>}
                        {slots.map((s, i) => (
                          <motion.button
                            key={s}
                            type="button"
                            className={`slot${slot === s ? ' on' : ''}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                            whileHover={{ scale: 1.08 }}
                            onMouseEnter={() => setHover(s)}
                            onFocus={() => setHover(s)}
                            onBlur={() => setHover(null)}
                            onClick={() => setSlot(s)}
                          >
                            {time(s)}
                          </motion.button>
                        ))}
                      </div>

                      {slot && (
                        <motion.form onSubmit={submit} className="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                          <label>Nume<input required minLength={2} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
                          <label>E-mail<input required type="email" maxLength={120} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
                          <label>Ce vrei să discutăm? (opțional)<textarea maxLength={500} rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
                          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} name="website" />
                          {error && <p className="error" role="alert">{error}</p>}
                          <button className="btn" disabled={submitting}>{submitting ? 'Se rezervă…' : `Rezervă ${time(slot)}`}</button>
                        </motion.form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
