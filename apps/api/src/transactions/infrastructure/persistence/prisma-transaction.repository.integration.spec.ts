process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { randomUUID } from 'node:crypto';
import { Money } from '@finanzas/shared';
import { Transaction } from '../../domain/transaction.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaTransactionRepository } from './prisma-transaction.repository';

// Integration tier: exercises the real Postgres instance from
// docker-compose (see design.md "Testing Strategy" — infrastructure tests
// run against real Postgres, not fakes). Also proves the owner-scoped query
// filters out another owner's row as defense-in-depth, and that listing
// filters (accountId, categoryId, date range) are satisfied by the
// (userId, ...) composite indexes (see design.md "Database Schema").
describe('PrismaTransactionRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaTransactionRepository(prisma);

  const ownerAId = `integration-owner-a-${randomUUID()}`;
  const ownerBId = `integration-owner-b-${randomUUID()}`;
  const accountAId = `integration-account-a-${randomUUID()}`;
  const accountA2Id = `integration-account-a2-${randomUUID()}`;
  const accountBId = `integration-account-b-${randomUUID()}`;
  const categoryAId = `integration-category-a-${randomUUID()}`;
  const categoryA2Id = `integration-category-a2-${randomUUID()}`;
  const categoryBId = `integration-category-b-${randomUUID()}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.createMany({
      data: [
        { id: ownerAId, email: `${ownerAId}@example.com`, passwordHash: '$argon2id$fake' },
        { id: ownerBId, email: `${ownerBId}@example.com`, passwordHash: '$argon2id$fake' },
      ],
    });
    await prisma.account.createMany({
      data: [
        { id: accountAId, userId: ownerAId, name: 'A Checking', type: 'bank' },
        { id: accountA2Id, userId: ownerAId, name: 'A Savings', type: 'bank' },
        { id: accountBId, userId: ownerBId, name: 'B Checking', type: 'bank' },
      ],
    });
    await prisma.category.createMany({
      data: [
        { id: categoryAId, userId: ownerAId, name: 'A Groceries', kind: 'expense' },
        { id: categoryA2Id, userId: ownerAId, name: 'A Salary', kind: 'income' },
        { id: categoryBId, userId: ownerBId, name: 'B Groceries', kind: 'expense' },
      ],
    });
  });

  afterEach(async () => {
    await prisma.transaction.deleteMany({ where: { userId: { in: [ownerAId, ownerBId] } } });
  });

  afterAll(async () => {
    await prisma.category.deleteMany({ where: { userId: { in: [ownerAId, ownerBId] } } });
    await prisma.account.deleteMany({ where: { userId: { in: [ownerAId, ownerBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerAId, ownerBId] } } });
    await prisma.$disconnect();
  });

  it('persists a transaction and finds it by id for its owner', async () => {
    const transaction = Transaction.create({
      id: randomUUID(),
      userId: ownerAId,
      accountId: accountAId,
      categoryId: categoryAId,
      type: 'expense',
      amount: Money.fromCents(3000),
      occurredOn: new Date('2026-07-01T00:00:00.000Z'),
      note: 'Weekly shop',
    });

    await repository.save(transaction);
    const found = await repository.findByIdForOwner(transaction.id, ownerAId);

    expect(found?.id).toBe(transaction.id);
    expect(found?.amount.amountCents).toBe(3000);
    expect(found?.note).toBe('Weekly shop');
  });

  it('returns null when the transaction belongs to a different owner', async () => {
    const transaction = Transaction.create({
      id: randomUUID(),
      userId: ownerBId,
      accountId: accountBId,
      categoryId: categoryBId,
      type: 'expense',
      amount: Money.fromCents(1000),
      occurredOn: new Date('2026-07-01T00:00:00.000Z'),
    });
    await repository.save(transaction);

    expect(await repository.findByIdForOwner(transaction.id, ownerAId)).toBeNull();
  });

  it('lists only transactions owned by the given owner', async () => {
    const ownerATransaction = Transaction.create({
      id: randomUUID(),
      userId: ownerAId,
      accountId: accountAId,
      categoryId: categoryAId,
      type: 'expense',
      amount: Money.fromCents(500),
      occurredOn: new Date('2026-07-01T00:00:00.000Z'),
    });
    const ownerBTransaction = Transaction.create({
      id: randomUUID(),
      userId: ownerBId,
      accountId: accountBId,
      categoryId: categoryBId,
      type: 'expense',
      amount: Money.fromCents(700),
      occurredOn: new Date('2026-07-01T00:00:00.000Z'),
    });
    await repository.save(ownerATransaction);
    await repository.save(ownerBTransaction);

    const found = await repository.listForOwner(ownerAId);

    expect(found.map((t) => t.id)).toContain(ownerATransaction.id);
    expect(found.map((t) => t.id)).not.toContain(ownerBTransaction.id);
  });

  it('filters listForOwner by accountId, categoryId, and date range', async () => {
    const matching = Transaction.create({
      id: randomUUID(),
      userId: ownerAId,
      accountId: accountAId,
      categoryId: categoryAId,
      type: 'expense',
      amount: Money.fromCents(300),
      occurredOn: new Date('2026-02-15T00:00:00.000Z'),
    });
    const wrongAccount = Transaction.create({
      id: randomUUID(),
      userId: ownerAId,
      accountId: accountA2Id,
      categoryId: categoryAId,
      type: 'expense',
      amount: Money.fromCents(400),
      occurredOn: new Date('2026-02-15T00:00:00.000Z'),
    });
    const wrongMonth = Transaction.create({
      id: randomUUID(),
      userId: ownerAId,
      accountId: accountAId,
      categoryId: categoryAId,
      type: 'expense',
      amount: Money.fromCents(500),
      occurredOn: new Date('2026-03-15T00:00:00.000Z'),
    });
    await repository.save(matching);
    await repository.save(wrongAccount);
    await repository.save(wrongMonth);

    const found = await repository.listForOwner(ownerAId, {
      accountId: accountAId,
      categoryId: categoryAId,
      fromDate: new Date('2026-02-01T00:00:00.000Z'),
      toDate: new Date('2026-02-28T23:59:59.999Z'),
    });

    expect(found.map((t) => t.id)).toEqual([matching.id]);
  });

  it('deletes a transaction by id', async () => {
    const transaction = Transaction.create({
      id: randomUUID(),
      userId: ownerAId,
      accountId: accountAId,
      categoryId: categoryAId,
      type: 'income',
      amount: Money.fromCents(200),
      occurredOn: new Date('2026-07-01T00:00:00.000Z'),
    });
    await repository.save(transaction);

    await repository.delete(transaction.id);

    expect(await repository.findByIdForOwner(transaction.id, ownerAId)).toBeNull();
  });
});
