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
- **Daily email**: a Vercel Cron Job hits `/api/cron/daily-email` once a day, which
  builds a summary of the last 24 hours (questions answered, accuracy, weak spots,
  streak, quiz/test scores) and emails it to the parent addresses via Gmail. There's
  also a plain `/api/daily-summary` (protected by an `x-report-secret` header) that
  returns the same data as JSON, for checking things manually without sending an email.

## Local setup

```bash
npm install
npx prisma migrate dev   # creates the local SQLite database
npm run dev
```

Copy `.env` and set your own values before real use:

- `APP_PIN` - the PIN Allie types to open the app (placeholder: `1234`)
- `APP_SESSION_SECRET` - random string that signs the login cookie
- `REPORT_SECRET` - random string required to call `/api/daily-summary` (also
  accepted by `/api/cron/daily-email` for manual testing)
- `DATABASE_URL` - `file:./dev.db` locally; a Turso URL in production (see below)
- `GMAIL_USER` - the Gmail address the daily email is sent from
- `GMAIL_APP_PASSWORD` - a Gmail [App Password](https://myaccount.google.com/apppasswords)
  for that address (not the regular login password)
- `PARENT_EMAILS` - comma-separated recipient addresses, e.g.
  `rsoto443@gmail.com,tmsoto04@gmail.com`
- `CRON_SECRET` - random string; Vercel automatically sends it as a bearer token
  when it calls `/api/cron/daily-email` on schedule

## Deploying

1. Push this repo to GitHub (already done if you're reading this from GitHub).
2. Create a free [Turso](https://turso.tech) database (SQLite-compatible, works
   great with serverless hosting) and copy its connection URL + auth token.
3. Prisma's migration tool can't talk to a Turso URL directly, so create the
   tables once by pasting `prisma/migrations/20260922031037_init/migration.sql`
   into Turso's web SQL shell for your database and running it.
4. Import the repo into [Vercel](https://vercel.com/new), and set all the
   environment variables listed above, then deploy. `vercel.json` already
   configures the daily cron job - no extra setup needed once the env vars
   are in place.

## Curriculum coverage (v1)

- Ratios & Rates
- Fractions, Decimals & Integers (The Number System)
- Expressions & Equations
- Geometry
- Statistics & Probability

More skills can be added by dropping a new generator function into
`src/lib/generators/` and registering it in `src/lib/curriculum.ts`.
