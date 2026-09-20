# F1 STACKMIND Cyber Academy

A cybersecurity **career-training platform** that connects **mentors** and **mentees** through weekly lessons, automatic OTP-verified accounts, attendance, and anti-copy quiz games — built with an 8-layer security model.

- **Frontend / hosting:** Next.js 16 (App Router) on **Vercel**
- **Backend & database:** **Supabase** (Auth, Postgres, Row Level Security)
- **Design:** dark cybersecurity terminal theme with the F1 STACKMIND logo

---

## Feature checklist

| Area | What you get |
|---|---|
| Auth | Sign up **with email OTP**, password login, OTP login. Mentor signup requires a secret access code. |
| Roles | `mentor` and `mentee` isolated at the proxy and API layers. |
| Weekly modules | Mentors publish week-based lessons; mentees read them and mark completion. |
| Attendance | Mentees one-tap mark their week; mentors see rates and history per mentee. |
| Quiz game | Timed quizzes, progress UI, auto-submit. Answers are **scored on the server** and never sent to the browser. |
| Anti-copy | Copy/paste/right-click/view-source blocks, DevTools & tab-switch detection (3 strikes = auto-submit). |
| Mentor HQ | Overview stats, module publishing, quiz builder, per-mentee performance, full audit log. |
| Security | 8 layers — see below. |

---

## 1. Supabase setup (backend)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste and run [`supabase/schema.sql`](supabase/schema.sql).
3. Paste and run [`supabase/seed.sql`](supabase/seed.sql) — loads 8 weekly lessons + 4 quizzes.
4. In **Authentication → Providers → Email**: turn on *Enable email signup*, and leave the **Confirm email** option **ON** (the app uses Supabase's OwnAuth email OTP). Keep `Secure password change` on.
   - For the OTP emails to actually be delivered you need an SMTP provider (Gmail, Resend, etc.) under **Authentication → SMTP**. Without it, OTP codes still work in local testing only if you also configure the **Inbucket/test** email; for production, add SMTP.
5. Note the project URL, **anon key**, and **service_role key** from **Settings → API**.

> The service role key has full DB access. It is only ever used inside server routes (`lib/supabase/admin.ts`) and is never sent to the browser.

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
MENTOR_ACCESS_CODE=pick-a-long-random-string
```

`MENTOR_ACCESS_CODE` is what a person must type when signing up as a **mentor**. Give it only to people you trust.

## 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. In local dev the OTP email goes to Supabase's default address — check the Supabase dashboard's **Auth → Email** log (or your SMTP inbox) for the 6-digit code.

## 4. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import it in [vercel.com](https://vercel.com) (framework is auto-detected: Next.js).
3. Add the **four environment variables** above under *Project → Settings → Environment Variables* (do this for Production and Preview).
4. Deploy.
5. In the Supabase dashboard, add your Vercel domain under **Authentication → URL Configuration** and **Project Settings → API → Allowed redirect URLs** so OTP/verify callbacks are accepted.

---

## The 8-layer security model

Implemented in this codebase:

1. **Transport security** — HTTPS + HSTS + CSP + frame-off headers (`next.config.ts`).
2. **Authentication** — Supabase Auth (bcrypt hashes, sessions, HttpOnly cookies via `@supabase/ssr`).
3. **Email OTP gate** — no usable account until a 6-digit code sent to the enrolled email is verified (`/api/auth/verify`).
4. **Row Level Security** — every table has RLS policies; the `quiz_questions` table (which contains correct answers) is **mentor-readable only**, and mentees consume a sanitized view.
5. **Role-based access** — proxy (`proxy.ts`) + server-side double-checking on both the API layer (`requireMentor`) and layouts.
6. **Rate limiting** — in-memory sliding window on login / OTP send / OTP verify (`lib/security/rate-limit.ts`).
7. **Validation & CSRF-safety** — Zod validation on every mutation, SameSite cookies, generic auth errors (no user enumeration).
8. **Application guards** — full audit logging of every sensitive action, anti-copy quiz engine, tab-switch detection, server-side answer scoring, and no `dangerouslySetInnerHTML` anywhere.

> Hardening note: the rate limiter is per-Vercel-function-instance. For global enforcement across all instances, swap `lib/security/rate-limit.ts` for a shared store (Vercel KV / Upstash).

## Project layout

```
app/
  page.tsx                 landing page (cyber theme + 8-layer explainer)
  auth/                    login / OTP / signup
  dashboard/               mentee area (overview, modules, quizzes, attendance)
  mentor/                  mentor area (overview, modules, quizzes, mentees, logs)
  api/                     server actions (auth, attendance, quiz submit, mentor CRUD, logs)
components/
  quiz/QuizGame.tsx        timed quiz UI
  quiz/AntiCopy.tsx        the anti-copy / anti-cheat engine
  mentor/…                 mentor utilities
lib/
  supabase/                browser / server-cookie / service-role clients
  security/                rate limiter, validators, audit log, mentor guard
proxy.ts                   route protection + role gates
supabase/schema.sql        tables + triggers + RLS + safe view
supabase/seed.sql          8 weeks of lessons + 4 quizzes
```

## Known limitations

- OTP delivery needs SMTP configured in Supabase (free tier emails are limited).
- The audit-log rate limiter and IP capture rely on Vercel's standard headers.
- The quiz anti-copy protections deter casual copying; they are not a substitute for proctoring, and the server-side scoring is the real enforcement.