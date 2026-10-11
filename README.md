# meet-with-me

A booking page (think Calendly) with a sky that follows the time of the slot you point at.

## Stack
- Next.js (App Router) + TypeScript
- Framer Motion for animation, plain CSS for styling
- Zod validation, `date-fns-tz` for timezones
- API routes: `/api/availability`, `/api/slots`, `/api/book`, `/api/ics`
- Storage: JSON file in `.data/` locally, Upstash Redis (REST) in production
- Optional e-mail notification to you via Resend

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Personalise
Edit `src/lib/config.ts`: your name, timezone, meeting types and weekly availability.

## Deploy (Vercel)
1. Push to GitHub and import the repo in Vercel.
2. Create a free Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (the file store does not persist on Vercel).
3. Optional: `RESEND_API_KEY`, `NOTIFY_EMAIL`, `FROM_EMAIL` for e-mail notifications.

## Ideas for next versions
- AI assistant that answers questions about you (serverless route, key kept server-side, rate limited)
- Google Calendar sync so availability is real
- Confirmation e-mail to the visitor (needs a verified sending domain)
