import { Injectable } from '@nestjs/common';
import type { TransactionReferencePort } from '../../application/ports/transaction-reference.port';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Real Prisma-backed implementation of `TransactionReferencePort`, querying
 * the `transactions` table directly (index-satisfied via the
 * (userId, categoryId) composite index — see schema.prisma). Replaces the
 * Phase-4 `NoTransactionsYetAdapter` stand-in now that the `transactions`
 * table exists (see design.md "Migration / Rollout").
 */
@Injectable()
export class PrismaTransactionReferenceAdapter implements TransactionReferencePort {
  constructor(private readonly prisma: PrismaService) {}

  async existsForCategory(categoryId: string): Promise<boolean> {
    const count = await this.prisma.transaction.count({ where: { categoryId } });
    return count > 0;
  }
}
