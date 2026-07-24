process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaTransactionReferenceAdapter } from './prisma-transaction-reference.adapter';

// Integration tier: proves the delete-guard now correctly blocks deletion
// once a real transaction references the category (see spec.md "Category
// Deletion Guard") — previously always false under the Phase-4
// `NoTransactionsYetAdapter` stand-in, since the `transactions` table did
// not exist yet.
describe('PrismaTransactionReferenceAdapter (integration)', () => {
  const prisma = new PrismaService();
  const adapter = new PrismaTransactionReferenceAdapter(prisma);

  const ownerId = `integration-owner-${randomUUID()}`;
  const accountId = `integration-account-${randomUUID()}`;
  const referencedCategoryId = `integration-category-referenced-${randomUUID()}`;
  const unreferencedCategoryId = `integration-category-unreferenced-${randomUUID()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.create({ data: { id: ownerId, email: `${ownerId}@example.com`, passwordHash: '$argon2id$fake' } });
    await prisma.account.create({ data: { id: accountId, userId: ownerId, name: 'Checking', type: 'bank' } });
    await prisma.category.createMany({
      data: [
        { id: referencedCategoryId, userId: ownerId, name: 'Referenced', kind: 'expense' },
        { id: unreferencedCategoryId, userId: ownerId, name: 'Unreferenced', kind: 'expense' },
      ],
    });
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId: ownerId,
        accountId,
        categoryId: referencedCategoryId,
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

  it('reports true when the category is referenced by at least one transaction', async () => {
    await expect(adapter.existsForCategory(referencedCategoryId)).resolves.toBe(true);
  });

  it('reports false when the category has no referencing transactions', async () => {
    await expect(adapter.existsForCategory(unreferencedCategoryId)).resolves.toBe(false);
  });
});
