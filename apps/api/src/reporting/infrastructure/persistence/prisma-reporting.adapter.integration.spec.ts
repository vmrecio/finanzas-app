process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaReportingAdapter } from './prisma-reporting.adapter';

// Integration tier: proves every aggregation is owner-scoped directly
// against Postgres (see spec.md "User-Scoped Reporting" and design.md
// "Reporting / Aggregation" — every query takes ownerId as a mandatory
// leading predicate).
describe('PrismaReportingAdapter (integration)', () => {
  const prisma = new PrismaService();
  const adapter = new PrismaReportingAdapter(prisma);

  const ownerA = `integration-owner-a-${randomUUID()}`;
  const ownerB = `integration-owner-b-${randomUUID()}`;
  const accountA = `integration-account-a-${randomUUID()}`;
  const accountB = `integration-account-b-${randomUUID()}`;
  const groceriesA = `integration-category-groceries-${randomUUID()}`;
  const transportA = `integration-category-transport-${randomUUID()}`;
  const salaryA = `integration-category-salary-${randomUUID()}`;
  const groceriesB = `integration-category-groceries-b-${randomUUID()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.createMany({
      data: [
        { id: ownerA, email: `${ownerA}@example.com`, passwordHash: '$argon2id$fake' },
        { id: ownerB, email: `${ownerB}@example.com`, passwordHash: '$argon2id$fake' },
      ],
    });
    await prisma.account.createMany({
      data: [
        { id: accountA, userId: ownerA, name: 'Checking A', type: 'bank' },
        { id: accountB, userId: ownerB, name: 'Checking B', type: 'bank' },
      ],
    });
    await prisma.category.createMany({
      data: [
        { id: groceriesA, userId: ownerA, name: 'Groceries', kind: 'expense' },
        { id: transportA, userId: ownerA, name: 'Transport', kind: 'expense' },
        { id: salaryA, userId: ownerA, name: 'Salary', kind: 'income' },
        { id: groceriesB, userId: ownerB, name: 'Groceries', kind: 'expense' },
      ],
    });
    await prisma.transaction.createMany({
      data: [
        // Owner A — July 2026
        {
          id: randomUUID(),
          userId: ownerA,
          accountId: accountA,
          categoryId: salaryA,
          type: 'income',
          amountCents: 200000n,
          occurredOn: new Date('2026-07-01T00:00:00.000Z'),
        },
        {
          id: randomUUID(),
          userId: ownerA,
          accountId: accountA,
          categoryId: groceriesA,
          type: 'expense',
          amountCents: 3000n,
          occurredOn: new Date('2026-07-05T00:00:00.000Z'),
        },
        {
          id: randomUUID(),
          userId: ownerA,
          accountId: accountA,
          categoryId: groceriesA,
          type: 'expense',
          amountCents: 1500n,
          occurredOn: new Date('2026-07-10T00:00:00.000Z'),
        },
        {
          id: randomUUID(),
          userId: ownerA,
          accountId: accountA,
          categoryId: transportA,
          type: 'expense',
          amountCents: 2000n,
          occurredOn: new Date('2026-07-15T00:00:00.000Z'),
        },
        // Owner A — June 2026 (previous month, must not leak into July aggregations)
        {
          id: randomUUID(),
          userId: ownerA,
          accountId: accountA,
          categoryId: groceriesA,
          type: 'expense',
          amountCents: 9000n,
          occurredOn: new Date('2026-06-10T00:00:00.000Z'),
        },
        {
          id: randomUUID(),
          userId: ownerA,
          accountId: accountA,
          categoryId: salaryA,
          type: 'income',
          amountCents: 150000n,
          occurredOn: new Date('2026-06-01T00:00:00.000Z'),
        },
        // Owner B — same period, must never leak into owner A's aggregations
        {
          id: randomUUID(),
          userId: ownerB,
          accountId: accountB,
          categoryId: groceriesB,
          type: 'expense',
          amountCents: 99999n,
          occurredOn: new Date('2026-07-05T00:00:00.000Z'),
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { userId: { in: [ownerA, ownerB] } } });
    await prisma.category.deleteMany({ where: { userId: { in: [ownerA, ownerB] } } });
    await prisma.account.deleteMany({ where: { userId: { in: [ownerA, ownerB] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerA, ownerB] } } });
    await prisma.$disconnect();
  });

  describe('getSpendByCategory', () => {
    it('sums expense amounts per category for the owner within the given range, excluding other owners and other periods', async () => {
      const result = await adapter.getSpendByCategory(
        ownerA,
        new Date('2026-07-01T00:00:00.000Z'),
        new Date('2026-07-31T23:59:59.999Z'),
      );

      expect(result).toEqual(
        expect.arrayContaining([
          { categoryId: groceriesA, categoryName: 'Groceries', totalCents: 4500 },
          { categoryId: transportA, categoryName: 'Transport', totalCents: 2000 },
        ]),
      );
      expect(result).toHaveLength(2);
    });

    it('returns an empty array when no expenses exist in the given period', async () => {
      const result = await adapter.getSpendByCategory(
        ownerA,
        new Date('2020-01-01T00:00:00.000Z'),
        new Date('2020-01-31T23:59:59.999Z'),
      );

      expect(result).toEqual([]);
    });
  });

  describe('getIncomeExpenseTrend', () => {
    it('groups income/expense totals by calendar month, owner-scoped, in chronological order', async () => {
      const result = await adapter.getIncomeExpenseTrend(
        ownerA,
        new Date('2026-06-01T00:00:00.000Z'),
        new Date('2026-07-31T23:59:59.999Z'),
      );

      expect(result).toEqual([
        { period: '2026-06', incomeCents: 150000, expenseCents: 9000 },
        { period: '2026-07', incomeCents: 200000, expenseCents: 6500 },
      ]);
    });

    it('returns an empty array when no transactions exist in the given range', async () => {
      const result = await adapter.getIncomeExpenseTrend(
        ownerA,
        new Date('2020-01-01T00:00:00.000Z'),
        new Date('2020-12-31T23:59:59.999Z'),
      );

      expect(result).toEqual([]);
    });
  });

  describe('getDashboardSummary', () => {
    it('computes the all-time total balance and the period income/expense totals, owner-scoped', async () => {
      const result = await adapter.getDashboardSummary(
        ownerA,
        new Date('2026-07-01T00:00:00.000Z'),
        new Date('2026-07-31T23:59:59.999Z'),
      );

      // all-time: income 200000+150000=350000, expense 3000+1500+2000+9000=15500 -> balance 334500
      expect(result.totalBalanceCents).toBe(334500);
      expect(result.periodIncomeCents).toBe(200000);
      expect(result.periodExpenseCents).toBe(6500);
    });
  });
});
