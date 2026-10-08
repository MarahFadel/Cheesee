# Season Poll

A live poll — **"What's your favorite season?"** — built with Next.js (App Router, TypeScript), Tailwind CSS and Supabase (Postgres + Realtime). Votes from any browser show up in every other open browser within about a second.

- Unlimited, anonymous voting (no login).
- Results always visible: animated bars, counts, percentages and total.
- Live updates via Supabase Realtime, with a re-sync on tab focus and channel reconnect so counts never drift.

## Project structure

```
app/
  layout.tsx          Root layout + metadata
  page.tsx            "/" — question + <Poll />
  globals.css         Tailwind + toast animation
components/
  Poll.tsx            State, initial load, realtime subscription, re-sync, voting
  VoteButtons.tsx     Four season buttons
  ResultsChart.tsx    Bars, counts, percentages, total
  Toast.tsx           "Vote counted!" / error toast
lib/
  supabase.ts         Browser client, season config, get_vote_counts() helper
supabase/migrations/
  001_init.sql        Table, RLS, RPC, realtime publication
```

## 1. Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor → New query**, paste the contents of [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) and click **Run**.

   This creates the `votes` table, enables Row Level Security (anon can only `INSERT` and `SELECT` — no update or delete), adds the `get_vote_counts()` function and adds `votes` to the `supabase_realtime` publication.

   (Using the Supabase CLI instead? `supabase link` then `supabase db push`.)
3. Optional check: **Database → Publications → supabase_realtime** should list `votes`.

## 2. Run locally

1. In Supabase, go to **Project Settings → API** and copy the **Project URL** and the **anon public** key. Never use the `service_role` key here.
2. Create your local env file:

   ```bash
   cp .env.example .env.local
   ```

   and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

   `.env.local` is gitignored.
3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3000 in two windows, vote in one and watch the other update.

## 3. Push to GitHub

If you're starting from a fresh copy of the code:

```bash
git init
git add .
git commit -m "Initial commit: live season poll"
```

Create an empty repository on GitHub (no README/.gitignore), then:

```bash
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Run `git status` before committing and check that `.env.local` isn't listed.

## 4. Deploy to Vercel

1. At [vercel.com/new](https://vercel.com/new), **Import** the GitHub repository. The Next.js framework preset is detected automatically.
2. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Deploy**. Every push to the default branch redeploys.

`NEXT_PUBLIC_*` values are baked in at build time, so if you change them in Vercel, trigger a redeploy.

## Scripts

| Command         | What it does                 |
| --------------- | ---------------------------- |
| `npm run dev`   | Local dev server             |
| `npm run build` | Production build + typecheck |
| `npm run lint`  | ESLint                       |
| `npm start`     | Serve the production build   |

## How live updates work

1. On load, the page calls `get_vote_counts()` for the totals (all four seasons, zeros included).
2. It subscribes to `postgres_changes` `INSERT` events on `public.votes` and increments the matching count locally.
3. It calls `get_vote_counts()` again whenever the channel (re)subscribes or the tab regains focus, so missed events can't cause drift.
4. The subscription and listeners are removed on unmount.

## Security notes

- Only the anon key is used, client-side. RLS limits anon to `INSERT`/`SELECT` on `votes`; updates and deletes are denied.
- The `season` column has a `CHECK` constraint, so only the four valid values can be stored.
- Voting is intentionally unlimited. To limit abuse on a public deployment, consider adding rate limiting (e.g. an Edge Function or Vercel middleware).
