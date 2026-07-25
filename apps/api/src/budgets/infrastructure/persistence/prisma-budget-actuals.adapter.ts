import { Injectable } from '@nestjs/common';
import type { BudgetActualsPort } from '../../application/ports/budget-actuals.port';
import { getMonthRangeForPeriod } from '../../application/budget-period';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Real Prisma-backed implementation of `BudgetActualsPort`: the actual is
 * derived on read as SUM(expense) over the category's transactions whose
 * `occurredOn` falls within the budget's `periodMonth`, owner-scoped (see
 * spec.md "Actual-vs-Limit Calculation" and design.md "Reporting /
 * Aggregation" — mirrors `PrismaReportingAdapter`'s owner-scoped
 * aggregation pattern). Index-satisfied via the (userId, categoryId)
 * composite index on `transactions`. This is a read-only query service: it
 * bypasses the Transaction repository and queries Prisma directly, as
 * design.md explicitly allows for aggregation.
 */
@Injectable()
export class PrismaBudgetActualsAdapter implements BudgetActualsPort {
  constructor(private readonly prisma: PrismaService) {}

  async getActualExpenseCents(
    ownerId: string,
    categoryId: string,
    periodMonth: string,
  ): Promise<number> {
    const { start, end } = getMonthRangeForPeriod(periodMonth);

    const sum = await this.prisma.transaction.aggregate({
      _sum: { amountCents: true },
      where: {
        userId: ownerId,
        categoryId,
        type: 'expense',
        occurredOn: { gte: start, lte: end },
      },
    });

    return Number(sum._sum.amountCents ?? 0n);
  }
}
