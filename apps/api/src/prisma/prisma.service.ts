import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma client wrapper, injected into every bounded-context
 * repository adapter (auth, accounts, categories, ...). Domain/application
 * layers never import this directly — only infrastructure adapters do (see
 * design.md "Migrations / ORM").
 *
 * Deliberately does NOT eagerly `$connect()` in onModuleInit: Prisma
 * connects lazily on first query by default. Eagerly connecting would force
 * every module that merely imports a module which happens to declare this
 * provider (e.g. AppModule -> AuthModule) to require a live DATABASE_URL,
 * even for requests that never touch the database (see app.controller.spec.ts
 * health check, which has no Prisma dependency of its own).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
