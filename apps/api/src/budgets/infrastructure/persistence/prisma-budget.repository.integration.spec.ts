process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { randomUUID } from 'node:crypto';
import { Money } from '@finanzas/shared';
import { Budget } from '../../domain/budget.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaBudgetRepository } from './prisma-budget.repository';

// Integration tier: exercises the real Postgres instance from
// docker-compose (see design.md "Testing Strategy" — infrastructure tests
// run against real Postgres, not fakes). Also proves the owner-scoped
// query filters out another owner's row as defense-in-depth, and that the
// DB-level @@unique([userId, categoryId, periodMonth]) constraint exists
// (see design.md "Duplicate rejection layering").
describe('PrismaBudgetRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaBudgetRepository(prisma);

  const ownerAId = `integration-budget-owner-a-${randomUUID()}`;
  const ownerBId = `integration-budget-owner-b-${randomUUID()}`;
  const categoryAId = `integration-budget-cat-a-${randomUUID()}`;
  const categoryBId = `integration-budget-cat-b-${randomUUID()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.createMany({
      data: [
        { id: ownerAId, email: `${ownerAId}@example.com`, passwordHash: '$argon2id$fake' },
        { id: ownerBId, email: `${ownerBId}@example.com`, passwordHash: '$argon2id$fake' },
      ],
    });
    await prisma.category.createMany({
      data: [
        { id: categoryAId, userId: ownerAId, name: 'Groceries', kind: 'expense' },
        { id: categoryBId, userId: ownerBId, name: "B's category", kind: 'expense' },
      ],
    });
  });

  afterEach(async () => {
    await prisma.budget.deleteMany({ where: { userId: { in: [ownerAId, ownerBId] } } });
  });

  afterAll(async () => {
    await prisma.category.deleteMany({ where: { id: { in: [categoryAId, categoryBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerAId, ownerBId] } } });
    await prisma.$disconnect();
  });

  it('persists a budget and finds it by id for its owner', async () => {
    const budget = Budget.create({
      id: randomUUID(),
      userId: ownerAId,
      categoryId: categoryAId,
      periodMonth: '2026-07',
      limit: Money.fromCents(50000),
    });

    await repository.save(budget);
    const found = await repository.findByIdForOwner(budget.id, ownerAId);

    expect(found?.id).toBe(budget.id);
    expect(found?.periodMonth).toBe('2026-07');
    expect(found?.limit.amountCents).toBe(50000);
  });

  it('returns null when the budget belongs to a different owner', async () => {
    const budget = Budget.create({
      id: randomUUID(),
      userId: ownerBId,
      categoryId: categoryBId,
      periodMonth: '2026-07',
      limit: Money.fromCents(20000),
    });
    await repository.save(budget);

    const found = await repository.findByIdForOwner(budget.id, ownerAId);

    expect(found).toBeNull();
  });

  it('lists only budgets owned by the given owner', async () => {
    const ownerABudget = Budget.create({
      id: randomUUID(),
      userId: ownerAId,
      categoryId: categoryAId,
      periodMonth: '2026-07',
      limit: Money.fromCents(50000),
    });
    const ownerBBudget = Budget.create({
      id: randomUUID(),
      userId: ownerBId,
      categoryId: categoryBId,
      periodMonth: '2026-07',
      limit: Money.fromCents(20000),
    });
    await repository.save(ownerABudget);
    await repository.save(ownerBBudget);

    const found = await repository.listForOwner(ownerAId);

    expect(found.map((b) => b.id)).toContain(ownerABudget.id);
    expect(found.map((b) => b.id)).not.toContain(ownerBBudget.id);
  });

  it('finds a budget by owner+category+month, and returns null for a different owner', async () => {
    const budget = Budget.create({
      id: randomUUID(),
      userId: ownerAId,
      categoryId: categoryAId,
      periodMonth: '2026-09',
      limit: Money.fromCents(15000),
    });
    await repository.save(budget);

    const foundForOwner = await repository.findByUserCategoryAndMonth(ownerAId, categoryAId, '2026-09');
    const foundForOtherOwner = await repository.findByUserCategoryAndMonth(
      ownerBId,
      categoryAId,
      '2026-09',
    );

    expect(foundForOwner?.id).toBe(budget.id);
    expect(foundForOtherOwner).toBeNull();
  });

  it('rejects a second budget for the same (userId, categoryId, periodMonth) at the DB level', async () => {
    const first = Budget.create({
      id: randomUUID(),
      userId: ownerAId,
      categoryId: categoryAId,
      periodMonth: '2026-10',
      limit: Money.fromCents(50000),
    });
    await repository.save(first);

    await expect(
      prisma.budget.create({
        data: {
          id: randomUUID(),
          userId: ownerAId,
          categoryId: categoryAId,
          periodMonth: '2026-10',
          limitCents: 30000n,
        },
      }),
    ).rejects.toThrow();
  });

  it('deletes a budget by id', async () => {
    const budget = Budget.create({
      id: randomUUID(),
      userId: ownerAId,
      categoryId: categoryAId,
      periodMonth: '2026-11',
      limit: Money.fromCents(10000),
    });
    await repository.save(budget);

    await repository.delete(budget.id);

    expect(await repository.findByIdForOwner(budget.id, ownerAId)).toBeNull();
  });
});
