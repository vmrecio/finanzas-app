import { Injectable } from '@nestjs/common';
import type { AccountBalancePort } from '../../application/ports/account-balance.port';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Real Prisma-backed implementation of `AccountBalancePort`: balance is
 * derived on read as SUM(income) - SUM(expense) over the account's
 * transactions, owner-scoped (see spec.md "Derived Balance Calculation" and
 * design.md "Balance/aggregate derivation" — no cached balance column).
 * Index-satisfied via the (userId, accountId) composite index.
 */
@Injectable()
export class PrismaAccountBalanceAdapter implements AccountBalancePort {
  constructor(private readonly prisma: PrismaService) {}

  async getBalanceForOwner(accountId: string, ownerId: string): Promise<number> {
    const [incomeSum, expenseSum] = await Promise.all([
      this.prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: { accountId, userId: ownerId, type: 'income' },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: { accountId, userId: ownerId, type: 'expense' },
      }),
    ]);

    const income = incomeSum._sum.amountCents ?? 0n;
    const expense = expenseSum._sum.amountCents ?? 0n;

    return Number(income - expense);
  }
}
