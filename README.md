# Allie's Math Practice

An adaptive 6th-grade math practice app, built for one student. It generates unlimited
practice questions across five strands (ratios, fractions/decimals/integers, expressions
& equations, geometry, and statistics), automatically leans on whichever topics she's
struggling with, and gives her regular quizzes (12 questions) and a weekly test
(20 questions).

## How it works

- **Login**: a 4-digit PIN on the shared family device - no email account needed.
- **Practice**: one question at a time. The app picks the next skill by weighting
  toward topics with low accuracy or that haven't been tried yet, and ramps the
  difficulty up after a hot streak or down after repeated misses.
- **Quiz / Test**: a fixed-length run across a mix of skills, scored at the end with
  a per-topic breakdown.
- **Progress page**: accuracy per strand, recent quiz/test history.
- **Daily email**: `/api/daily-summary` returns a JSON summary (questions answered,
  accuracy, weak spots, streak) for the last 24 hours. It's protected by a secret
  header (`x-report-secret`), not the PIN - it's meant to be called by an automated
  job, not opened in a browser.

## Local setup

```bash
npm install
npx prisma migrate dev   # creates the local SQLite database
npm run dev
```

Copy `.env` and set your own values before real use:

- `APP_PIN` - the PIN Allie types to open the app (placeholder: `1234`)
- `APP_SESSION_SECRET` - random string that signs the login cookie
- `REPORT_SECRET` - random string required to call `/api/daily-summary`
- `DATABASE_URL` - `file:./dev.db` locally; a Turso URL in production (see below)

## Deploying

1. Push this repo to GitHub (already done if you're reading this from GitHub).
2. Create a free [Turso](https://turso.tech) database (SQLite-compatible, works
   great with serverless hosting) and copy its connection URL + auth token.
3. Prisma's migration tool can't talk to a Turso URL directly, so create the
   tables once by pasting `prisma/migrations/20260922031037_init/migration.sql`
   into Turso's web SQL shell for your database and running it.
4. Import the repo into [Vercel](https://vercel.com/new), and set `DATABASE_URL`
   (the Turso URL), `DATABASE_AUTH_TOKEN`, `APP_PIN`, `APP_SESSION_SECRET`, and
   `REPORT_SECRET` as environment variables, then deploy.
5. Once the app has a live URL, wire up the daily parent email (a scheduled job
   that calls `GET /api/daily-summary` with the `x-report-secret` header and
   emails the result to Rich and Toni).

## Curriculum coverage (v1)

- Ratios & Rates
- Fractions, Decimals & Integers (The Number System)
- Expressions & Equations
- Geometry
- Statistics & Probability

More skills can be added by dropping a new generator function into
`src/lib/generators/` and registering it in `src/lib/curriculum.ts`.
