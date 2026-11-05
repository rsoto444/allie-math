# Allie's Math Practice

A mastery-based math practice app, built for one student. It covers 49 core skills
from Grade 3 through Grade 6 as one locked learning path: she works on exactly one
skill at a time and can't move forward until she has proven it. Questions are
generated procedurally, so practice never runs out.

## How it works

- **Login**: a 4-digit PIN on the shared family device - no email account needed.
- **Check-ups** (one per grade, 3 questions per skill): a skill answered 3/3 is
  marked mastered on the spot; anything less becomes a gap on the path. Grade 4's
  check-up unlocks after Grade 3's is finished, and so on. A check-up can be
  stopped and resumed.
- **Practice**: always the earliest unmastered skill, with difficulty that ramps
  up after two correct and down after two misses. Five correct in a row unlocks
  the Mastery Check for that skill.
- **Mastery Check**: 8 questions at mixed difficulty on that one skill; 7/8 passes
  and unlocks the next skill. A fail sends her back to practice, and the 5-in-a-row
  counter restarts from zero.
- **Review**: 10 mixed questions drawn only from skills already mastered.
- **Progress page**: every skill's status per grade, plus a history of check-ups,
  mastery checks and reviews.
- **Daily email**: a Vercel Cron Job hits `/api/cron/daily-email` once a day, which
  builds a summary of the last 24 hours (questions answered, skills mastered, check-up
  results and gaps, mastery checks passed or failed, current focus skill, streak) and
  emails it to the parent addresses via Gmail. There's also a plain
  `/api/daily-summary` (protected by an `x-report-secret` header) that returns the
  same data as JSON.

The rules (3 per skill on check-ups, 5-in-a-row, 7 of 8) live in `src/lib/rules.ts`.

## Checks

```bash
npx tsx scripts/check-generators.ts   # every skill x difficulty x 400 seeds is well-formed
npx tsx scripts/e2e.ts                # full path walkthrough against a fresh dev DB (see file header)
```

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
3. Prisma's migration tool can't talk to a Turso URL directly, so apply the
   schema by pasting the SQL into Turso's web SQL shell for your database:
   `prisma/migrations/20260922031037_init/migration.sql` for a brand-new
   database, then `prisma/turso/002_mastery_path.sql` (a paste-safe version of
   the second migration). An existing database only needs the second file.
4. Import the repo into [Vercel](https://vercel.com/new), and set all the
   environment variables listed above, then deploy. `vercel.json` already
   configures the daily cron job - no extra setup needed once the env vars
   are in place.

## Curriculum coverage

- Grade 3 (8 skills): add/subtract with regrouping, place value & rounding,
  multiplication and division facts, word problems, fraction basics, comparing
  fractions, area & perimeter
- Grade 4 (10 skills): big-number place value, multi-digit multiplication, long
  division, factors & multiples, equivalent and comparing fractions, like-denominator
  add/subtract, fraction x whole number, decimals intro, multi-step word problems
- Grade 5 (11 skills): decimal place value, order of operations, 2-digit division,
  unlike-denominator fractions, mixed numbers, multiplying/dividing fractions,
  decimal operations, volume, coordinate plane
- Grade 6 (20 skills): ratios & percents, the number system, expressions & equations,
  geometry, statistics & probability

Skills are defined in `src/lib/curriculum.ts` (that order IS the path) and each has a
generator in `src/lib/generators/`.
