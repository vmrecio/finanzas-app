process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaBudgetReferenceAdapter } from './prisma-budget-reference.adapter';

// Integration tier: proves the delete-guard correctly blocks deletion once a
// real budget references the category (see GitHub issue #17 — the
// budgets.category_id ON DELETE RESTRICT FK previously caused a raw 500
// instead of a clean 409 when a category had a budget but zero
// transactions). Mirrors PrismaTransactionReferenceAdapter's integration spec.
describe('PrismaBudgetReferenceAdapter (integration)', () => {
  const prisma = new PrismaService();
  const adapter = new PrismaBudgetReferenceAdapter(prisma);

  const ownerId = `integration-owner-${randomUUID()}`;
  const referencedCategoryId = `integration-category-referenced-${randomUUID()}`;
  const unreferencedCategoryId = `integration-category-unreferenced-${randomUUID()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.create({
      data: { id: ownerId, email: `${ownerId}@example.com`, passwordHash: '$argon2id$fake' },
    });
    await prisma.category.createMany({
      data: [
        { id: referencedCategoryId, userId: ownerId, name: 'Referenced', kind: 'expense' },
        { id: unreferencedCategoryId, userId: ownerId, name: 'Unreferenced', kind: 'expense' },
      ],
    });
    await prisma.budget.create({
      data: {
        id: randomUUID(),
        userId: ownerId,
        categoryId: referencedCategoryId,
        periodMonth: '2026-07',
        limitCents: 10_000n,
      },
    });
  });

  afterAll(async () => {
    await prisma.budget.deleteMany({ where: { userId: ownerId } });
    await prisma.category.deleteMany({ where: { userId: ownerId } });
    await prisma.user.delete({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  it('reports true when the category is referenced by at least one budget', async () => {
    await expect(adapter.existsForCategory(referencedCategoryId)).resolves.toBe(true);
  });

  it('reports false when the category has no referencing budgets', async () => {
    await expect(adapter.existsForCategory(unreferencedCategoryId)).resolves.toBe(false);
  });
});
