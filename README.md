# Finanzas

A personal finance management app: manual income/expense tracking, accounts
with derived balances, categories, a spend/trend/summary dashboard, and
monthly per-category budgets. Multi-user (open registration), EUR-only,
single-currency, no bank-sync/imports — every amount is entered manually.

Monorepo (pnpm + Turborepo):

- `apps/api` — NestJS API, hexagonal architecture (domain/application/infrastructure
  per bounded context: auth, accounts, categories, transactions, budgets, reporting).
- `apps/web` — Next.js 16 (App Router) frontend, atomic design + container/presentational
  components.
- `packages/shared` — shared DTOs/contracts and the `Money` value object.

## Prerequisites

- Node.js >= 20
- pnpm 11.x (`corepack enable` will pick up the pinned version in `package.json`)
- Docker + Docker Compose (for Postgres, and optionally for running the whole
  stack in containers)

## Environment variables

There is no `.env` auto-loading in this repo (no `dotenv`/`ConfigModule`) —
`apps/api` reads `process.env` directly, so these must be present in the
environment that starts it (exported in your shell, or passed via
`docker-compose.yml`, which already sets them for the `api`/`web` services).

| Variable | Used by | Default if unset | Purpose |
|---|---|---|---|
| `DATABASE_URL` | `apps/api` | none — required | Postgres connection string, e.g. `postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public` |
| `JWT_SECRET` | `apps/api` | `dev-secret-change-me` | Signs/verifies access + refresh JWTs. Set a real secret outside local dev. |
| `PORT` | `apps/api` | `3001` | HTTP port the API listens on. |
| `WEB_ORIGIN` | `apps/api` | `http://localhost:3000` | Allowed CORS origin (must match wherever `apps/web` is served from; credentials are enabled). |
| `NEXT_PUBLIC_API_URL` | `apps/web` | `http://localhost:3001` | Base URL the web api-client calls. |

A copy-pasteable template lives in `.env.example` at the repo root (or
`apps/api/.env.example`) — copy it to `.env` and adjust as needed. If that
file is missing in your checkout, sandbox restrictions in a prior session
blocked creating it; use the table above to set the same variables directly
(see "Known limitation" at the end of this file).

## Running the full stack

### Option A — Docker Compose (recommended, closest to CI/prod)

```sh
docker compose up -d --build
```

This starts `postgres` (with a healthcheck), `api` (port 3001, applies
migrations are NOT run automatically — see below), and `web` (port 3000, Next
dev server). Source is bind-mounted, so edits are picked up live.

The first time (or after a schema change), apply migrations against the
containerized Postgres:

```sh
DATABASE_URL="postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public" \
  pnpm --filter @finanzas/api exec prisma migrate deploy
```

If `web` gets stuck restarting after a `pnpm-lock.yaml` change (pnpm refuses
a non-interactive `node_modules` purge inside the container), rebuild its
image instead of just recreating the container:

```sh
docker compose build web && docker compose up -d --force-recreate -V web
```

Then visit `http://localhost:3000`.

### Option B — Local processes + Dockerized Postgres only

```sh
docker compose up -d postgres
export DATABASE_URL="postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public"
export JWT_SECRET=dev-secret-change-me
pnpm --filter @finanzas/api exec prisma migrate deploy
pnpm dev   # runs apps/api (nest start --watch) and apps/web (next dev) in parallel via Turborepo
```

`apps/web` defaults `NEXT_PUBLIC_API_URL` to `http://localhost:3001`, matching
`apps/api`'s local port, so no extra env var is needed for this option.

## Running tests

```sh
# Everything via Turborepo (lint/typecheck/build/unit-test for every package)
pnpm exec turbo run lint typecheck build test

# apps/api unit + integration tests (needs a real Postgres reachable at DATABASE_URL)
DATABASE_URL="postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public" \
  JWT_SECRET=integration-test-secret \
  pnpm --filter @finanzas/api exec jest --runInBand

# apps/web unit/component tests (Vitest + React Testing Library)
pnpm --filter @finanzas/web test
```

### End-to-end tests (Playwright)

The E2E suite drives a real browser against the full stack (real HTTP, real
Postgres) — it is intentionally separate from the Vitest/RTL unit suite above
(different runner, different process model) and is never wired into the
Turborepo `test` task.

1. Boot the full stack (Option A or B above) and make sure migrations are applied.
2. Install browsers once: `pnpm --filter @finanzas/web exec playwright install chromium`
3. Run the suite:
   ```sh
   pnpm --filter @finanzas/web exec playwright test
   # or: pnpm --filter @finanzas/web test:e2e
   ```

The spec registers two fresh users per run (unique emails) and covers:
register → log in → create account/category/transaction → dashboard reflects
the transaction → create a budget that the transaction already exceeds →
register a second user and confirm their accounts/dashboard/budgets are all
empty (per-user data isolation).

## Known limitation

`.env.example` could not be created in this checkout — the sandbox that ran
the final implementation phase denied writes to the repo root and to
`apps/api/`. Use the "Environment variables" table above until that file is
added out-of-band.
