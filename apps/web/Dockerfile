# Development image for @finanzas/web.
# Build context is the monorepo root (needs the full pnpm workspace).
FROM node:22-alpine

WORKDIR /workspace

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /workspace/apps/web

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
