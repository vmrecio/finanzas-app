# Development image for @finanzas/api.
# Build context is the monorepo root (needs the full pnpm workspace).
FROM node:22-alpine

WORKDIR /workspace

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /workspace/apps/api

# @prisma/client's own postinstall hook runs from the workspace root and
# cannot find prisma/schema.prisma there (it lives under apps/api). Generate
# explicitly from the correct working directory so the client matches the
# checked-in schema instead of shipping the unconfigured stock client.
RUN pnpm exec prisma generate

EXPOSE 3001

CMD ["pnpm", "run", "start:dev"]
