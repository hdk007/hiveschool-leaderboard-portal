# 🚀 Deployment Guide — HiveSchool Leaderboard Portal

This guide walks through deploying the app to **Netlify** with **Supabase Cloud** as the backend.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com> → **New project**. Pick a region close to your users and set a strong database password.
2. Wait for provisioning (~2 min).
3. Open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** secret → `SUPABASE_SERVICE_ROLE_KEY` *(keep secret — never commit)*

---

## 2. Apply the database schema

1. Open **SQL Editor → New query** in the Supabase dashboard.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.

This creates:
- **Tables** — admins, teams, students, leaderboard_settings, curriculum_modules, announcements, daily_challenges, achievements, student_achievements, team_challenge_scores, leaderboard_history, notifications, activity_logs.
- **Leaderboard engine** — `recalculate_leaderboard()`, `snapshot_leaderboard()`, `is_admin()`, `updated_at` triggers, and auto-recompute triggers.
- **Row Level Security** — public read, admin-only writes.
- **Storage buckets** — `student-images`, `achievement-icons`, `curriculum-assets`, `challenge-assets`, `announcement-assets` (public read, admin write).
- **Realtime** — public tables added to the `supabase_realtime` publication.

### Verify Realtime
**Database → Replication → `supabase_realtime`** should list the public tables. If a table is missing, re-run the `0005_realtime` section of `schema.sql`.

---

## 3. Bootstrap the admin account

Run the seed script **once** from your local machine after the schema is applied. This creates the admin user in Supabase Auth and inserts the corresponding row in `public.admins`.

```bash
# Make sure .env.local is filled in first (see step 5)
npm run seed
```

> If you ever re-run the full schema SQL (which drops all tables), run `npx tsx scripts/fix-admin.ts` afterwards to restore admin access without wiping your data.

---

## 4. Deploy to Netlify

### Option A — Netlify UI (recommended for first deploy)

1. Push the repository to GitHub / GitLab / Bitbucket.
2. Go to <https://app.netlify.com> → **Add new site → Import an existing project**.
3. Select your repository.
4. Netlify auto-detects the settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Plugin:** `@netlify/plugin-nextjs` (applied automatically)
5. Click **Deploy site** — the first build will install and configure everything.

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init          # link or create a new Netlify site
netlify deploy --build --prod
```

---

## 5. Set environment variables in Netlify

Go to **Site settings → Environment variables** and add **all** of the following:

| Variable | Where to find it | Visible in browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key | ❌ **Secret** |
| `NEXT_PUBLIC_SITE_URL` | Your Netlify site URL, e.g. `https://hiveschool.netlify.app` | ✅ Yes |
| `ADMIN_EMAIL` | The email you want for the admin login | ❌ Secret |
| `ADMIN_PASSWORD` | The password you want for the admin login | ❌ **Secret** |

> **Important:** `NEXT_PUBLIC_SITE_URL` must be set to your exact Netlify domain (including `https://`) — it controls Open Graph metadata and absolute URLs. Update it whenever you add a custom domain.

After setting variables, trigger a **redeploy** from the Netlify dashboard so the new values are picked up.

---

## 6. Custom domain (optional)

1. **Netlify:** Site settings → Domain management → Add custom domain.
2. **DNS:** Add the CNAME/A records Netlify shows you at your domain registrar.
3. Netlify provisions a free Let's Encrypt TLS certificate automatically.
4. Update `NEXT_PUBLIC_SITE_URL` to your new domain and redeploy.

---

## 7. Supabase Auth redirect URLs

After deploying, add your production URL to the Supabase Auth allowed list so magic-link and OAuth flows work correctly:

1. Supabase dashboard → **Authentication → URL Configuration**.
2. Add to **Redirect URLs**: `https://<your-netlify-domain>/auth/callback`
3. Set **Site URL** to `https://<your-netlify-domain>`.

---

## 8. Ongoing admin tasks

| Task | How |
|---|---|
| **Recalculate leaderboard** | Admin dashboard → Leaderboard → "Recalculate" button |
| **Snapshot leaderboard** | Admin dashboard → Analytics → "Snapshot" button (or automate via Supabase pg_cron) |
| **Reset all data** | Run `npx tsx scripts/clear-all-data.ts` locally |
| **Re-bootstrap admin** | Run `npx tsx scripts/fix-admin.ts` locally |

---

## Checklist before go-live

- [ ] Schema SQL executed successfully in Supabase
- [ ] `npm run seed` run at least once (admin account exists)
- [ ] All 6 environment variables set in Netlify
- [ ] First deploy succeeded (green build in Netlify)
- [ ] `/admin/login` works with your credentials
- [ ] Leaderboard page loads without errors
- [ ] Realtime updates work (add a team → leaderboard updates live)
- [ ] `NEXT_PUBLIC_SITE_URL` updated to the real domain and redeployed
