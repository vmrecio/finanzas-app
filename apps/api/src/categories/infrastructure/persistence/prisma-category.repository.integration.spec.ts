process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { randomUUID } from 'node:crypto';
import { Category } from '../../domain/category.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaCategoryRepository } from './prisma-category.repository';

// Integration tier: exercises the real Postgres instance from
// docker-compose (see design.md "Testing Strategy" — infrastructure tests
// run against real Postgres, not fakes). Also proves the owner-scoped
// query filters out another owner's row as defense-in-depth (see
// design.md "Ownership scoping / data isolation").
describe('PrismaCategoryRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaCategoryRepository(prisma);

  const ownerAId = `integration-cat-owner-a-${randomUUID()}`;
  const ownerBId = `integration-cat-owner-b-${randomUUID()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.createMany({
      data: [
        { id: ownerAId, email: `${ownerAId}@example.com`, passwordHash: '$argon2id$fake' },
        { id: ownerBId, email: `${ownerBId}@example.com`, passwordHash: '$argon2id$fake' },
      ],
    });
  });

  afterEach(async () => {
    await prisma.category.deleteMany({ where: { userId: { in: [ownerAId, ownerBId] } } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [ownerAId, ownerBId] } } });
    await prisma.$disconnect();
  });

  it('persists a category and finds it by id for its owner', async () => {
    const category = Category.create({
      id: randomUUID(),
      userId: ownerAId,
      name: 'Groceries',
      kind: 'expense',
    });

    await repository.save(category);
    const found = await repository.findByIdForOwner(category.id, ownerAId);

    expect(found?.id).toBe(category.id);
    expect(found?.name).toBe('Groceries');
    expect(found?.kind).toBe('expense');
  });

  it('returns null when the category belongs to a different owner', async () => {
    const category = Category.create({
      id: randomUUID(),
      userId: ownerBId,
      name: "Owner B's category",
      kind: 'income',
    });
    await repository.save(category);

    const found = await repository.findByIdForOwner(category.id, ownerAId);

    expect(found).toBeNull();
  });

  it('lists only categories owned by the given owner', async () => {
    const ownerACategory = Category.create({
      id: randomUUID(),
      userId: ownerAId,
      name: "Owner A's category",
      kind: 'expense',
    });
    const ownerBCategory = Category.create({
      id: randomUUID(),
      userId: ownerBId,
      name: "Owner B's category",
      kind: 'income',
    });
    await repository.save(ownerACategory);
    await repository.save(ownerBCategory);

    const found = await repository.listForOwner(ownerAId);

    expect(found.map((c) => c.id)).toContain(ownerACategory.id);
    expect(found.map((c) => c.id)).not.toContain(ownerBCategory.id);
  });

  it('finds a category by name and kind scoped to the owner, and returns null for a different owner', async () => {
    const category = Category.create({
      id: randomUUID(),
      userId: ownerAId,
      name: 'Salary',
      kind: 'income',
    });
    await repository.save(category);

    const foundForOwner = await repository.findByNameAndKindForOwner('Salary', 'income', ownerAId);
    const foundForOtherOwner = await repository.findByNameAndKindForOwner(
      'Salary',
      'income',
      ownerBId,
    );

    expect(foundForOwner?.id).toBe(category.id);
    expect(foundForOtherOwner).toBeNull();
  });

  it('deletes a category by id', async () => {
    const category = Category.create({
      id: randomUUID(),
      userId: ownerAId,
      name: 'To Delete',
      kind: 'expense',
    });
    await repository.save(category);

    await repository.delete(category.id);

    expect(await repository.findByIdForOwner(category.id, ownerAId)).toBeNull();
  });
});
