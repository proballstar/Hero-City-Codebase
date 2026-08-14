# QWEN.md

## What this project is

Hero City is a community storytelling site for celebrating everyday heroes. A
signed-in user can publish a Markdown story, optionally upload a cover image,
and readers can support the hero with a Stripe Checkout donation. The product
calls these records “stories,” but the Prisma model and most of the existing
routes call them `Post`.

## Architecture

- **Framework:** Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS
  4. Pages and server-rendered data access live under `app/`; interactive UI
  belongs in `components/`.
- **Persistence:** PostgreSQL through Prisma. The Prisma client singleton is in
  `lib/prisma.ts`; the schema and migrations are in `prisma/`.
- **Domain model:** `Post` is the story, `HeroProfile` is the canonical hero
  identity and payout destination, and `PostEvent` is the append-only activity
  log. `User`, `Account`, `Session`, and `VerificationToken` support Auth.js.
  `Image` stores an optional cover image as database bytes. `Donation` stores
  an idempotently recorded Stripe Checkout session.
- **Authentication:** Auth.js/NextAuth with Google OAuth when configured.
  `AUTH_DEV_LOGIN=true` adds a passwordless local-development provider and must
  never be enabled in production.
- **Hero claims and payouts:** Claim links are seven-day, SHA-256-backed
  secrets. The authenticated claim flow creates or reuses a Stripe Connect
  Express account and sends the hero through Stripe-hosted onboarding.
  Signature-verified webhooks process donation completion, Connect account
  updates, and identity verification events.
- **Donations:** Checkout is gated on a verified hero profile, an available
  connected payout account, and an unflagged post. Destination charges use
  `payment_intent_data.transfer_data.destination`. The success-return path and
  webhook both record the session through an idempotent upsert.

### Important routes

- `/` — paginated story home page (12 stories per page).
- `/create` — authenticated story creation.
- `/posts/[id]` — story page, history, and donation controls.
- `/stories/[id]` — product-facing alias for `/posts/[id]`.
- `/posts/[id]/edit` — story editing.
- `/claim/[token]` — authenticated hero claim and Connect onboarding.
- `/admin/verifications` — admin-only verification and payout review queue.
- `/api/posts`, `/api/posts/[id]` — story CRUD.
- `/api/hero-claims` — claim invitation/self-claim initiation.
- `/api/donate/checkout` and `/api/webhooks/stripe` — current donation and
  Stripe webhook paths. Legacy `/api/stripe/*` compatibility routes remain.
- `/api/images/[id]` — serves database-backed cover image bytes.

## Developer notes

- Preserve the distinction between **editing authorization** and **payment
  enablement**. A claimed hero should not automatically need Stripe, bank, or
  KYC information merely to edit a story.
- Current edit authorization still depends on `Post.heroEmail`, while claims
  also record `HeroProfile.claimedByUserId`. A hero-initiated claim for a post
  without `heroEmail` may therefore not grant edit access. Treat this as a
  known boundary and use explicit purpose-specific editor permissions for a
  future fix.
- Existing posts are backfilled to hero profiles, but newly created posts
  currently receive their own profile. There is not yet a UI for finding and
  reusing one profile across multiple stories.
- Keep claim secrets, Auth secrets, Stripe keys, Resend keys, and provider
  errors out of persistence and logs. Only the raw claim secret belongs in the
  emailed URL; the database stores its hash.
- Do not treat `VERIFIED`, `sent_at`, or a successful API response as proof of
  a completed real-world provider flow without checking the provider and live
  database. Manual admin approval and Stripe readiness are separate operational
  concerns.
- Cover uploads are capped at 2 MiB and stored in PostgreSQL. Keep this limit
  in mind when changing upload handling or database deployment settings.
- Use repository-pinned tooling. After dependencies are installed, prefer
  `npm exec prisma` over an unqualified `npx prisma`; the repository uses
  Prisma 6 configuration and an unqualified command may fetch Prisma 7.
- The checked-out working tree may contain unrelated user changes. Inspect
  `git status` before editing and preserve changes outside the requested scope.

## Configuration and local development

Copy `.env.example` to `.env`. The important settings are `DATABASE_URL`,
`AUTH_SECRET`, optional Google OAuth credentials, `AUTH_DEV_LOGIN` for local
only login, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`, and the
Resend settings `RESEND_API_KEY` and `EMAIL_FROM`.

Install and run locally:

```bash
npm ci
npm run db:migrate:dev
npm run dev
```

If no auth provider is configured, browsing remains available but authenticated
authoring and editing do not. If Stripe is not configured, the UI shows a setup
notice and donations are unavailable.

## Verification

Run the static checks from the repository root:

```bash
npm exec prisma validate
npm run lint
npm run build
git diff --check
```

If no real database is available, use a non-secret placeholder PostgreSQL URL
only for static schema/build validation, for example:

```bash
DATABASE_URL='postgresql://placeholder:placeholder@localhost:5432/herocity' npm exec prisma validate
```

There is currently no automated test script in `package.json`. Static checks do
not validate Google/Auth.js login, Resend delivery, PostgreSQL migrations,
Stripe Checkout, Connect onboarding, webhook signatures, or live payout/KYC
behavior. Those flows require separate integration or browser verification
with safe test credentials and a reachable database/provider.

# Overnight work

Use the overnight-pr Skill for overnight feature work.

Never deploy or merge automatically.
