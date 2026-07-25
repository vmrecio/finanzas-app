import { Injectable } from '@nestjs/common';
import type {
  DashboardSummaryResult,
  IncomeExpenseTrendEntry,
  ReportingPort,
  SpendByCategoryEntry,
} from '../../application/ports/reporting.port';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

interface TrendRow {
  period: string;
  incomeCents: bigint;
  expenseCents: bigint;
}

/**
 * Real Prisma-backed implementation of `ReportingPort`. Every aggregation is
 * owner-scoped (`userId` as the leading predicate, matching the
 * `(userId, ...)` composite indexes) and derived on read — no cached
 * aggregates (see spec.md "Reporting Specification" and design.md
 * "Reporting / Aggregation"). This is a read-only query service: it bypasses
 * the Account/Category/Transaction repositories and queries Prisma
 * directly, as design.md explicitly allows for aggregation.
 */
@Injectable()
export class PrismaReportingAdapter implements ReportingPort {
  constructor(private readonly prisma: PrismaService) {}

  async getSpendByCategory(
    ownerId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<SpendByCategoryEntry[]> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: ownerId,
        type: 'expense',
        occurredOn: { gte: fromDate, lte: toDate },
      },
      _sum: { amountCents: true },
    });

    if (grouped.length === 0) {
      return [];
    }

    const categories = await this.prisma.category.findMany({
      where: { userId: ownerId, id: { in: grouped.map((row) => row.categoryId) } },
      select: { id: true, name: true },
    });
    const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

    return grouped.map((row) => ({
      categoryId: row.categoryId,
      categoryName: categoryNameById.get(row.categoryId) ?? row.categoryId,
      totalCents: Number(row._sum.amountCents ?? 0n),
    }));
  }

  async getIncomeExpenseTrend(
    ownerId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<IncomeExpenseTrendEntry[]> {
    // Prisma's typed `groupBy` cannot group by a truncated-timestamp
    // expression, so the monthly bucketing needs a raw query. Sums are cast
    // to `::bigint` explicitly so Postgres returns `bigint` (matching
    // `amountCents`'s schema type) instead of `numeric`/`Decimal`.
    const rows = await this.prisma.$queryRaw<TrendRow[]>`
      SELECT to_char(date_trunc('month', occurred_on), 'YYYY-MM') AS period,
             COALESCE(SUM(amount_cents) FILTER (WHERE type = 'income'), 0)::bigint AS "incomeCents",
             COALESCE(SUM(amount_cents) FILTER (WHERE type = 'expense'), 0)::bigint AS "expenseCents"
      FROM transactions
      WHERE user_id = ${ownerId}
        AND occurred_on >= ${fromDate}
        AND occurred_on <= ${toDate}
      GROUP BY period
      ORDER BY period ASC
    `;

    return rows.map((row) => ({
      period: row.period,
      incomeCents: Number(row.incomeCents),
      expenseCents: Number(row.expenseCents),
    }));
  }

  async getDashboardSummary(
    ownerId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<DashboardSummaryResult> {
    const [allTimeIncome, allTimeExpense, periodIncome, periodExpense] = await Promise.all([
      this.prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: { userId: ownerId, type: 'income' },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: { userId: ownerId, type: 'expense' },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: { userId: ownerId, type: 'income', occurredOn: { gte: periodStart, lte: periodEnd } },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: { userId: ownerId, type: 'expense', occurredOn: { gte: periodStart, lte: periodEnd } },
      }),
    ]);

    const totalBalanceCents = Number(
      (allTimeIncome._sum.amountCents ?? 0n) - (allTimeExpense._sum.amountCents ?? 0n),
    );

    return {
      totalBalanceCents,
      periodIncomeCents: Number(periodIncome._sum.amountCents ?? 0n),
      periodExpenseCents: Number(periodExpense._sum.amountCents ?? 0n),
    };
  }
}
