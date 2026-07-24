import { Injectable } from '@nestjs/common';
import type { TransactionExistencePort } from '../../application/ports/transaction-existence.port';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Real Prisma-backed implementation of `TransactionExistencePort`, querying
 * the `transactions` table directly (index-satisfied via the
 * (userId, accountId) composite index — see schema.prisma). Replaces the
 * Phase-3 `NoTransactionsYetAdapter` stand-in now that the `transactions`
 * table exists (see design.md "Migration / Rollout").
 */
@Injectable()
export class PrismaTransactionExistenceAdapter implements TransactionExistencePort {
  constructor(private readonly prisma: PrismaService) {}

  async existsForAccount(accountId: string): Promise<boolean> {
    const count = await this.prisma.transaction.count({ where: { accountId } });
    return count > 0;
  }
}
