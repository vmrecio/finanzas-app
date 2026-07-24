process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaTransactionExistenceAdapter } from './prisma-transaction-existence.adapter';

// Integration tier: proves the delete-guard now correctly blocks deletion
// once a real transaction references the account (see spec.md "Account
// Deletion Guard") — previously always false under the Phase-3
// `NoTransactionsYetAdapter` stand-in, since the `transactions` table did
// not exist yet.
describe('PrismaTransactionExistenceAdapter (integration)', () => {
  const prisma = new PrismaService();
  const adapter = new PrismaTransactionExistenceAdapter(prisma);

  const ownerId = `integration-owner-${randomUUID()}`;
  const accountWithTransactionId = `integration-account-with-tx-${randomUUID()}`;
  const accountWithoutTransactionId = `integration-account-without-tx-${randomUUID()}`;
  const categoryId = `integration-category-${randomUUID()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.create({ data: { id: ownerId, email: `${ownerId}@example.com`, passwordHash: '$argon2id$fake' } });
    await prisma.account.createMany({
      data: [
        { id: accountWithTransactionId, userId: ownerId, name: 'Has Transactions', type: 'bank' },
        { id: accountWithoutTransactionId, userId: ownerId, name: 'No Transactions', type: 'bank' },
      ],
    });
    await prisma.category.create({ data: { id: categoryId, userId: ownerId, name: 'Groceries', kind: 'expense' } });
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId: ownerId,
        accountId: accountWithTransactionId,
        categoryId,
        type: 'expense',
        amountCents: 500n,
        occurredOn: new Date('2026-07-01T00:00:00.000Z'),
      },
    });
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { userId: ownerId } });
    await prisma.category.deleteMany({ where: { userId: ownerId } });
    await prisma.account.deleteMany({ where: { userId: ownerId } });
    await prisma.user.delete({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  it('reports true when the account has at least one transaction', async () => {
    await expect(adapter.existsForAccount(accountWithTransactionId)).resolves.toBe(true);
  });

  it('reports false when the account has no transactions', async () => {
    await expect(adapter.existsForAccount(accountWithoutTransactionId)).resolves.toBe(false);
  });
});
