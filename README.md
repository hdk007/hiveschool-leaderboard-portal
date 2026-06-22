# 🐝 HiveSchool Leaderboard Portal

> **Track. Compete. Grow.** — A premium, production-grade EdTech performance dashboard built with **Next.js 15** and **Supabase**.

A real-time SaaS leaderboard platform for HiveSchool. Public users browse live rankings, curriculum, challenges, achievements and announcements with **zero login**. Admins get a secure dashboard to manage everything — and every change pushes **live to all connected devices** via Supabase Realtime.

---

## ✨ Features

### Public (no login required)
- **Landing page** — hero, live statistics, top-5 performers preview, curriculum preview.
- **Leaderboard** — live rankings with search, batch/status filters, sorting, pagination, **CSV & PDF export**, animated rank changes, and a rich **student profile modal**.
- **Curriculum** — 8 expandable modules with topics, assignments, resources & completion.
- **Weekly Challenges** — live countdowns, points, participants, status.
- **Achievements** — badge gallery with unlock animations + a recent-unlocks feed.
- **Announcements** — pinned + prioritised posts.
- **Notification center**, **dark mode**, fully **responsive** (desktop / tablet / mobile).

### Admin (secure)
- **Supabase Auth** login (admin-only, enforced in middleware **and** layout).
- Full **CRUD** for Students, Curriculum, Challenges, Announcements, Achievements.
- **Leaderboard engine** with admin-configurable weights + **live preview** of re-ranking.
- **Image uploads** to Supabase Storage (student photos, assets).
- **Analytics dashboard** (Recharts) — revenue / attendance / score trends, batch revenue, participation, distribution.
- **Activity logs** (audit trail) + real-time **activity feed** + **notification** broadcasts.
- One-click **recalculate** & **snapshot** of standings.

### Live leaderboard engine
Scores recompute automatically (Postgres triggers) whenever revenue, assignments, attendance, challenge score, or the weights change:

```
final_score =  40% · normalized(revenue)
            +  25% · normalized(assignments)
            +  20% · attendance_percentage
            +  15% · normalized(challenge_score)
```

Each metric is normalised to 0–100 against the cohort maximum, then blended by the configurable weights. Rankings update in Supabase and stream to every client instantly.

---

## 🧱 Tech Stack

| Layer | Tech |
|------|------|
| Framework | **Next.js 15** (App Router, Server Components, Server Actions) |
| Language | **TypeScript** (strict) |
| Styling | **Tailwind CSS** + ShadCN-style UI primitives |
| Animation | **Framer Motion** |
| Charts | **Recharts** |
| Icons | **Lucide** |
| Data / Auth / Storage / Realtime | **Supabase** (PostgreSQL, Auth, Storage, Realtime, RLS) |
| Data fetching | React Query + Supabase JS |
| Validation | **Zod** |
| Export | jsPDF + jsPDF-AutoTable |

---

## 📁 Project Structure

```
src/
├─ app/
│  ├─ (public)/              # Public, no-login pages (shared header/footer)
│  │  ├─ page.tsx            #   Landing
│  │  ├─ leaderboard/
│  │  ├─ curriculum/
│  │  ├─ challenges/
│  │  ├─ announcements/
│  │  └─ achievements/
│  ├─ admin/
│  │  ├─ login/              # Standalone login (no shell)
│  │  └─ (dashboard)/        # Protected admin shell + pages
│  ├─ actions/              # Server Actions (auth + CRUD per entity)
│  ├─ layout.tsx            # Root layout + providers
│  ├─ error.tsx / not-found.tsx
│  └─ globals.css           # Design-system tokens
├─ components/
│  ├─ ui/                   # Button, Card, Dialog, Table, … (ShadCN-style)
│  ├─ charts/               # Recharts wrappers
│  ├─ modals/ forms/ managers/   # Feature components
│  ├─ admin/ leaderboard/ landing/ curriculum/ challenges/ achievements/
│  └─ layout/ shared/
├─ hooks/                   # Realtime hooks
├─ lib/
│  ├─ supabase/             # Browser / server / middleware clients
│  ├─ queries.ts            # Server-side data access
│  ├─ ranking.ts            # Score engine (client mirror of SQL)
│  ├─ validators.ts         # Zod schemas
│  ├─ export.ts             # CSV / PDF export
│  ├─ auth.ts  constants.ts  utils.ts
├─ types/database.ts        # DB types
└─ middleware.ts            # Session refresh + /admin protection
supabase/
├─ migrations/0001…0005.sql # Schema, functions, RLS, storage, realtime
└─ schema.sql               # Combined one-shot script
scripts/seed.ts             # Admin + demo data seeder
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js ≥ 18.18** and npm
- A free **Supabase** project → <https://supabase.com>

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in from **Supabase → Project Settings → API**:

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` secret (server only) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin bootstrap (defaults provided) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for dev |

### 3. Create the database

Open **Supabase → SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and **Run**.
(Or run the numbered files in `supabase/migrations/` in order.)

This creates all tables, the leaderboard engine (functions + triggers), Row Level Security, Storage buckets + policies, and enables Realtime.

### 4. Seed the admin + demo data

```bash
npm run seed
```

Creates the admin Supabase Auth user and generates **50 students, 8 modules, 12 badges, 20 announcements, 10 challenges**, awards, history & notifications.

### 5. Run

```bash
npm run dev
```

- App → <http://localhost:3000>
- Admin → <http://localhost:3000/admin/login>

**Default admin login**

```
Email:    hiveschool@admin.in
Password: Hive@adminlogin
```

> Credentials live in environment variables and the password is hashed by Supabase Auth — never hardcoded in the frontend.

---

## 🔐 Security

- **JWT** sessions via Supabase Auth, refreshed in middleware.
- **Protected `/admin`** routes (middleware redirect + server-side admin check).
- **Row Level Security** on every table — public can only *read* public data; only admins can write.
- **Storage policies** — public read, admin-only upload/update/delete.
- **Server-side validation** (Zod) on every mutation.
- **Audit logs** for every admin action.
- Service-role key is **server-only** (never exposed to the browser).

---

## 🧮 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run seed` | Seed admin + demo data |

---

## ☁️ Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full Vercel + Supabase guide. TL;DR:

1. Push to GitHub and **import into Vercel**.
2. Add the same env vars in Vercel → Project → Settings → Environment Variables.
3. Run `supabase/schema.sql` on your production Supabase project, then `npm run seed`.
4. Deploy. 🎉

---

## 📝 Notes

- The database is the **single source of truth**. No mock data, no localStorage for critical data — every value is fetched from Supabase in real time.
- Realtime subscriptions keep all clients in sync; SSR pages re-render on change via a lightweight refresher.
- UI primitives are hand-built (ShadCN-style) — no Radix dependency, keeping the install lean and React-19 friendly.

Built with ❤️ for HiveSchool.
