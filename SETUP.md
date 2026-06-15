# BiteExpress — Setup Guide

A single-restaurant BiteExpress ordering app with three roles, built on a split architecture:

- **`server`** — Apollo GraphQL API (port 4000) + PostgreSQL (Prisma) + Redis subscriptions + Winston/Slack logging
- **`frontend`** — Next.js UI (port 3000) + NextAuth (Auth.js) with Auth0

## Roles

| Role | How they access | What they can do |
|------|-----------------|------------------|
| **Customer** | Public, no login (guest checkout) | Browse menu (`/`), place orders, track by order ID (`/track`) |
| **Staff** | Auth0 login | Manage orders, update status (`/staff`) |
| **Admin** | Auth0 login | Everything staff can + revenue dashboard (`/admin`) + menu management |

Roles live in Postgres. Configure `ADMIN_EMAILS` / `STAFF_EMAILS` so the right people are promoted automatically on first login.

## Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a hosted URL)
- Redis running locally (`redis-server`) — required for subscriptions
- An Auth0 application (Regular Web Application)

## 1. Backend (`server`)

```bash
cd server
npm install
cp .env.example .env   # then fill in the values
```

Fill in `.env`:

- `DATABASE_URL` — your PostgreSQL connection string
- `AUTH_SHARED_SECRET` — any long random string (must match the Next.js app)
- `SERVICE_TOKEN` — any long random string (must match the Next.js app)
- `ADMIN_EMAILS` / `STAFF_EMAILS` — comma-separated emails to auto-promote
- `SLACK_WEBHOOK_URL` — optional, for order alerts

Create the schema and seed the menu:

```bash
npm run db:push      # creates tables from prisma/schema.prisma
npm run db:seed      # seeds menu items + ensures ADMIN_EMAILS/STAFF_EMAILS
npm run dev          # starts the API at http://localhost:4000/graphql
```

> Use `npm run db:migrate` instead of `db:push` if you want versioned migration files.

## 2. Frontend (`frontend`)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # then fill in the values
```

Fill in `.env.local`:

- `AUTH_SECRET` — run `npx auth secret` (or `openssl rand -base64 32`)
- `AUTH_AUTH0_ID`, `AUTH_AUTH0_SECRET`, `AUTH_AUTH0_ISSUER` — from your Auth0 app
- `AUTH_SHARED_SECRET` / `SERVICE_TOKEN` — **must match the server's `.env`**

In the Auth0 dashboard, set:

- **Allowed Callback URLs:** `http://localhost:3000/api/auth/callback/auth0`
- **Allowed Logout URLs:** `http://localhost:3000`

Then:

```bash
npm run dev          # starts the UI at http://localhost:3000
```

## 3. Run order

1. `redis-server`
2. `server` → `npm run dev`
3. `frontend` → `npm run dev`
4. Open http://localhost:3000

## How auth flows (high level)

```
Staff/Admin → Auth0 (via NextAuth) → NextAuth jwt callback calls server `syncUser`
  (authorized by SERVICE_TOKEN) → role read from Postgres
  → NextAuth signs a backend JWT with AUTH_SHARED_SECRET (embeds role)
  → Apollo Client sends it on HTTP + WebSocket
  → Apollo server verifies the signature → context { userId, role }
  → resolvers enforce permissions (requireStaff / requireAdmin)
```

Customers never log in; their orders are created as guests and tracked by order ID.

## Logging & monitoring

- **Winston** — structured logs in the server (pretty in dev, JSON in prod for future ELK shipping)
- **Slack** — set `SLACK_WEBHOOK_URL` to get a message on every new order and on cancellations
- **ELK** — deferred; the JSON log format is ready to ship to Logstash/Elasticsearch later

## Notes

- Order prices are resolved server-side from the menu — the client never sets the price.
- Every order create / status change writes an `OrderEvent` row, shown as the order's history on the track page.
