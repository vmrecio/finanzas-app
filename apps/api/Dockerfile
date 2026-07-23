# Development image for @finanzas/api.
# Build context is the monorepo root (needs the full pnpm workspace).
FROM node:22-alpine

WORKDIR /workspace

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /workspace/apps/api

EXPOSE 3001

CMD ["pnpm", "run", "start:dev"]
