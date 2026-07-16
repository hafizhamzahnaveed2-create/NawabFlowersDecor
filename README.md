# Nawab Flowers Decorr

Full-stack florist storefront: fresh stems and raw materials, ready-made
bouquets by occasion/flower type, a build-your-own bouquet builder, and gift
add-ons — with an admin dashboard built for a non-technical florist.

## Stack

- **Frontend**: Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Framer Motion · TanStack Query · Zustand · Zod
- **Backend**: Next.js Route Handlers (`app/api/*`), repository layer in `lib/`
- **Database**: Neon (serverless Postgres) via Prisma ORM with `@prisma/adapter-neon`
- **Auth**: NextAuth (Auth.js v5), JWT sessions, roles: `CUSTOMER` / `STAFF` / `ADMIN` plus granular staff roles & permissions

## Getting started

1. Copy `.env.example` to `.env` and fill in values (see comments in the file).
   Neon gives you two connection strings per branch — the **pooled** one goes
   in `DATABASE_URL` (app runtime), the **direct** one in `DIRECT_URL`
   (migrations only).
2. Install and set up:

```bash
npm install          # also runs `prisma generate`
npm run db:migrate   # apply migrations to your Neon branch
npm run db:seed      # base categories, tags, staff roles, admin user
npm run dev
```

The seed creates an admin account from `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`. Sign in at `/login`; change the password after first use.

## Project structure

```
app/            routes & UI (App Router)
app/api/        route handlers (API layer), organized by domain
lib/            Prisma client, auth, validation, business logic
lib/generated/  generated Prisma client (gitignored)
prisma/         schema, migrations, seed
types/          shared type declarations (NextAuth augmentation)
```

Conventions:

- **All database access goes through `lib/`** — no Prisma calls in components,
  no client-side database access.
- **All schema changes go through Prisma Migrate** (`npm run db:migrate`) —
  never edit the Neon database directly.
- `/admin/*` requires `STAFF` or `ADMIN`; `/account/*` requires sign-in —
  enforced in `proxy.ts` (Next 16 edge auth), not just hidden in the UI.
- Order confirmation pages require the access token from checkout (`?t=…`),
  account ownership, or staff role — order numbers alone are not enough.

## Database workflow (Neon)

- One Neon branch per environment (production, staging); create a branch per
  feature for schema experiments.
- `npm run db:migrate` — create/apply migrations in development (uses `DIRECT_URL`).
- `npm run db:deploy` — apply committed migrations in CI/production.
- `npm run db:studio` — inspect data.

## Design tokens

Palette (defined in `app/globals.css`): Ivory `#FAF7F1`, Blush `#E7B8B4`,
Sage `#7D8B6A`, Burgundy `#582B35`, Ink `#2B2724`, Stone `#EAE3D8`.
Type: Fraunces (display) + Karla (body). Motion is restrained and physical;
`prefers-reduced-motion` is respected globally.

## Build phases

Phase 1 (foundation) — **done**.
Phase 2 (MVP storefront) — **done**.
Phase 3 (admin MVP: products, orders, homepage content) — **done**.
Phase 4 (Build-Your-Own Bouquet) — **done**.
Next: Phase 5 (growth & retention), then full CMS, analytics, hardening,
security/CI, optional AI.

## Admin

Sign in with the seeded admin account, then open `/admin`:

- **Dashboard** — today’s deliveries, revenue, low-stock alerts
- **Products** — create/edit/delete with flags, variants, sale pricing
- **Orders** — filter, search, update status
- **Content** — edit homepage hero and announcement bar (no deploy needed)
- **Builder** — manage stems/greenery/wrap/ribbon/vase options for Build-Your-Own

Customer Build-Your-Own lives at `/builder` (live preview + pricing → cart).
