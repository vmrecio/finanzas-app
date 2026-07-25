process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaBudgetActualsAdapter } from './prisma-budget-actuals.adapter';

// Integration tier: exercises the real Postgres instance, proving the
// actual-vs-limit aggregation is owner-scoped (userId leading predicate)
// and matches expense transactions within the budget's calendar month by
// `occurredOn` (see spec.md "Actual-vs-Limit Calculation").
describe('PrismaBudgetActualsAdapter (integration)', () => {
  const prisma = new PrismaService();
  const adapter = new PrismaBudgetActualsAdapter(prisma);

  const ownerAId = `integration-budget-actuals-owner-a-${randomUUID()}`;
  const ownerBId = `integration-budget-actuals-owner-b-${randomUUID()}`;
  const accountId = `integration-budget-actuals-acc-${randomUUID()}`;
  const categoryId = `integration-budget-actuals-cat-${randomUUID()}`;
  const otherOwnerCategoryId = `integration-budget-actuals-cat-b-${randomUUID()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.createMany({
      data: [
        { id: ownerAId, email: `${ownerAId}@example.com`, passwordHash: '$argon2id$fake' },
        { id: ownerBId, email: `${ownerBId}@example.com`, passwordHash: '$argon2id$fake' },
      ],
    });
    await prisma.account.create({ data: { id: accountId, userId: ownerAId, name: 'Checking', type: 'bank' } });
    await prisma.category.createMany({
      data: [
        { id: categoryId, userId: ownerAId, name: 'Groceries', kind: 'expense' },
        { id: otherOwnerCategoryId, userId: ownerBId, name: "B's groceries", kind: 'expense' },
      ],
    });
  });

  afterEach(async () => {
    await prisma.transaction.deleteMany({ where: { userId: { in: [ownerAId, ownerBId] } } });
  });

  afterAll(async () => {
    await prisma.account.deleteMany({ where: { id: accountId } });
    await prisma.category.deleteMany({ where: { id: { in: [categoryId, otherOwnerCategoryId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerAId, ownerBId] } } });
    await prisma.$disconnect();
  });

  it('sums matching expense transactions within the given calendar month', async () => {
    await prisma.transaction.createMany({
      data: [
        {
          id: randomUUID(),
          userId: ownerAId,
          accountId,
          categoryId,
          type: 'expense',
          amountCents: 3000n,
          occurredOn: new Date('2026-07-05T00:00:00.000Z'),
        },
        {
          id: randomUUID(),
          userId: ownerAId,
          accountId,
          categoryId,
          type: 'expense',
          amountCents: 2000n,
          occurredOn: new Date('2026-07-20T00:00:00.000Z'),
        },
        // outside the month — must not be counted
        {
          id: randomUUID(),
          userId: ownerAId,
          accountId,
          categoryId,
          type: 'expense',
          amountCents: 9999n,
          occurredOn: new Date('2026-08-01T00:00:00.000Z'),
        },
        // income in the same category/month — must not be counted
        {
          id: randomUUID(),
          userId: ownerAId,
          accountId,
          categoryId,
          type: 'income',
          amountCents: 100000n,
          occurredOn: new Date('2026-07-10T00:00:00.000Z'),
        },
      ],
    });

    const actual = await adapter.getActualExpenseCents(ownerAId, categoryId, '2026-07');

    expect(actual).toBe(5000);
  });

  it('returns zero when there are no matching transactions', async () => {
    const actual = await adapter.getActualExpenseCents(ownerAId, categoryId, '2026-12');

    expect(actual).toBe(0);
  });

  it("excludes another owner's transactions even for the same categoryId/period shape", async () => {
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId: ownerBId,
        accountId,
        categoryId: otherOwnerCategoryId,
        type: 'expense',
        amountCents: 7000n,
        occurredOn: new Date('2026-07-05T00:00:00.000Z'),
      },
    });

    const actual = await adapter.getActualExpenseCents(ownerAId, otherOwnerCategoryId, '2026-07');

    expect(actual).toBe(0);
  });
});
