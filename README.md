# Hero City

Hero City is a community site for celebrating everyday heroes. Anyone can publish a
story about a hero in their community (with a cover image and Markdown content),
and readers can support that hero with a PayPal donation.

Built with [Next.js 16](https://nextjs.org/) (App Router), [Prisma](https://www.prisma.io/)
+ PostgreSQL, [Tailwind CSS 4](https://tailwindcss.com/), and the
[PayPal REST API](https://developer.paypal.com/docs/api/orders/v2/).

## Features

- **Hero stories** — create, browse, and read posts. Story content supports
  GitHub-flavored Markdown.
- **Cover images** — uploaded images (up to 2 MB) are stored in the database, so no
  external object-storage account is needed.
- **PayPal donations** — donors pick a preset or custom amount; orders are created
  and captured server-side and every donation is recorded in the database. Each
  post shows its running total.

## Getting started

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL database (local install, Docker, or a hosted provider such as
  [Neon](https://neon.tech), Supabase, or Railway)

### 2. Configure environment

Copy the example env file and fill it in:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PAYPAL_ENV` | `sandbox` (default) or `live` |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | REST credentials from the [PayPal developer dashboard](https://developer.paypal.com/dashboard/applications) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Same client ID, exposed to the browser to render the PayPal buttons |

The app runs without PayPal credentials — the donate section simply shows a
"not configured" notice until they are set.

### 3. Install, migrate, run

```bash
npm install
npm run db:migrate:dev   # creates/updates the database schema
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Any platform that runs Next.js works (Vercel, Railway, Fly.io, a VPS):

1. Provision a Postgres database and set `DATABASE_URL`.
2. Set the PayPal variables with **live** credentials and `PAYPAL_ENV=live`.
3. Run `npm run db:migrate` (i.e. `prisma migrate deploy`) as part of your release step.
4. `npm run build && npm start` (on Vercel this is automatic; `prisma generate` runs
   in the build script).

## Project structure

```
app/                    App Router pages and API routes
  page.tsx              Home — grid of hero stories
  create/               "Share a Hero" form
  posts/[id]/           Story page with Markdown content + donations
  api/posts/            List/create posts (multipart upload)
  api/images/[id]/      Serves cover images from the database
  api/paypal/           Server-side order create + capture
components/             Client components (create form, donate section)
lib/                    Prisma client singleton, PayPal REST helpers
prisma/                 Schema and migrations (Post, Image, Donation)
```

## API

| Method & path | Description |
| --- | --- |
| `GET /api/posts` | List posts (id, name, author, image id) |
| `POST /api/posts` | Create a post (`multipart/form-data`: `name`, `authorName`, `content`, optional `image`) |
| `GET /api/images/:id` | Cover image bytes |
| `POST /api/paypal/orders` | Create a PayPal order (`{ postId, amount }`) |
| `POST /api/paypal/orders/:orderId/capture` | Capture an approved order and record the donation |
