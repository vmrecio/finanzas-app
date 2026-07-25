process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaAccountBalanceAdapter } from './prisma-account-balance.adapter';

// Integration tier: proves the balance is derived as SUM(income) -
// SUM(expense) directly from the transactions table, owner-scoped (see
// spec.md "Derived Balance Calculation" and design.md "Balance/aggregate
// derivation" — SUM on read, no cached column).
describe('PrismaAccountBalanceAdapter (integration)', () => {
  const prisma = new PrismaService();
  const adapter = new PrismaAccountBalanceAdapter(prisma);

  const ownerId = `integration-owner-${randomUUID()}`;
  const accountId = `integration-account-${randomUUID()}`;
  const emptyAccountId = `integration-account-empty-${randomUUID()}`;
  const categoryIncomeId = `integration-category-income-${randomUUID()}`;
  const categoryExpenseId = `integration-category-expense-${randomUUID()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.create({ data: { id: ownerId, email: `${ownerId}@example.com`, passwordHash: '$argon2id$fake' } });
    await prisma.account.createMany({
      data: [
        { id: accountId, userId: ownerId, name: 'Checking', type: 'bank' },
        { id: emptyAccountId, userId: ownerId, name: 'Empty', type: 'bank' },
      ],
    });
    await prisma.category.createMany({
      data: [
        { id: categoryIncomeId, userId: ownerId, name: 'Salary', kind: 'income' },
        { id: categoryExpenseId, userId: ownerId, name: 'Groceries', kind: 'expense' },
      ],
    });
    await prisma.transaction.createMany({
      data: [
        {
          id: randomUUID(),
          userId: ownerId,
          accountId,
          categoryId: categoryIncomeId,
          type: 'income',
          amountCents: 10000n,
          occurredOn: new Date('2026-07-01T00:00:00.000Z'),
        },
        {
          id: randomUUID(),
          userId: ownerId,
          accountId,
          categoryId: categoryExpenseId,
          type: 'expense',
          amountCents: 3000n,
          occurredOn: new Date('2026-07-02T00:00:00.000Z'),
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { userId: ownerId } });
    await prisma.category.deleteMany({ where: { userId: ownerId } });
    await prisma.account.deleteMany({ where: { userId: ownerId } });
    await prisma.user.delete({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  it('computes the balance as income minus expense for the account', async () => {
    await expect(adapter.getBalanceForOwner(accountId, ownerId)).resolves.toBe(7000);
  });

  it('returns zero for an account with no transactions', async () => {
    await expect(adapter.getBalanceForOwner(emptyAccountId, ownerId)).resolves.toBe(0);
  });
});
