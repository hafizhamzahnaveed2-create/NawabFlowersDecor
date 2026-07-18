# Nawab Flowers Decor

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
`SEED_ADMIN_PASSWORD`, plus two staff accounts (password from
`SEED_STAFF_PASSWORD`, or `SEED_ADMIN_PASSWORD` if unset). Sign in at
`/login`; change passwords after first use.

**Seeded accounts**

| Email | Role |
| --- | --- |
| `admin@nawabflowers.local` | Full admin |
| `catalog@nawabflowers.local` | Catalog Manager |
| `orders@nawabflowers.local` | Order Fulfillment |

Password: `SEED_ADMIN_PASSWORD` (admin) / `SEED_STAFF_PASSWORD` (staff).

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
Phase 5 (growth & retention: coupons, wishlist, reviews, FBT, recently
viewed, newsletter, abandoned-cart hook, loyalty points) — **done**.
Phase 6 (content & marketing: CMS slides/banners/FAQ/policies/blog,
promo popup, flash-sale countdown) — **done**.
Phase 7 (analytics & reporting: KPIs, funnel, retention, CSV exports,
Neon views, lightweight event tracking) — **done**.
Phase 8a (enterprise hardening: RBAC, shipping zones & tax, feature flags,
maintenance mode, activity log) — **done**.
Next: Phase 8b (i18n, display-only multi-currency, branches), then security/CI.

## Admin

Sign in with the seeded admin account, then open `/admin`:

- **Dashboard** — today’s deliveries, revenue, low-stock alerts
- **Analytics** — date-range KPIs, funnel, retention, CSV exports
- **Products** — create/edit/delete with flags, variants, sale pricing
- **Orders** — filter, search, update status
- **Coupons** — create and manage promo codes
- **Reviews** — moderate product reviews before they go live
- **Payments** — JazzCash / EasyPaisa / bank accounts for manual checkout
- **Settings** — WhatsApp number, social links, maintenance mode, feature flags
- **Shipping & tax** — delivery zones and tax rules (checkout quotes by city)
- **Content** — homepage hero/announcement, banners, popup, FAQs, policies, journal
- **Builder** — manage stems/greenery/wrap/ribbon/vase options for Build-Your-Own

Customer Build-Your-Own lives at `/builder` (live preview + pricing → cart).
Seeded promo codes: `WELCOME10` (10% off, min Rs 2000) and `FLAT500`
(Rs 500 off, min Rs 3000).

Storefront content routes: `/faq`, `/blog`, `/policies/shipping`,
`/policies/returns`.

Analytics lives at `/admin/analytics` (staff only). CSV exports:
`/api/admin/analytics/export?type=orders|products|newsletter`.

Receipt images upload via `/api/uploads` — Vercel Blob when
`BLOB_READ_WRITE_TOKEN` is set, otherwise `public/uploads/` in local dev.

Customers can create an account at `/register` (linked from `/login`).

## Deploy (Vercel + Neon)

This is a single Next.js app — UI and API routes ship together. Neon is the
database, not a separate backend. You do **not** need Railway or a split
frontend/backend repo for launch.

1. Push the repo to GitHub.
2. In [Vercel](https://vercel.com), import the project.
3. Set environment variables (from `.env.example`):
   - `DATABASE_URL` — Neon **pooled** connection string
   - `DIRECT_URL` — Neon **direct** connection string (migrations)
   - `AUTH_SECRET` — `npx auth secret`
   - `AUTH_URL` — your production URL, e.g. `https://your-app.vercel.app`
   - `BLOB_READ_WRITE_TOKEN` — recommended for product/receipt uploads
4. Build command (Vercel project settings):

```bash
npx prisma migrate deploy && next build
```

5. Deploy, then open the production URL and verify `/login`, `/register`,
   checkout, and `/admin`.

Staff and admin accounts are seeded locally; for production, either run
`npm run db:seed` once against the production Neon branch or create staff
from `/admin/staff` after the first admin exists. Rotate the seed password
immediately after first use.
