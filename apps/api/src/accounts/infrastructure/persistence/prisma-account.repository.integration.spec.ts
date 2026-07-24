process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { randomUUID } from 'node:crypto';
import { Account } from '../../domain/account.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaAccountRepository } from './prisma-account.repository';

// Integration tier: exercises the real Postgres instance from
// docker-compose (see design.md "Testing Strategy" — infrastructure tests
// run against real Postgres, not fakes). Also proves the owner-scoped
// query filters out another owner's row as defense-in-depth (see
// design.md "Ownership scoping / data isolation").
describe('PrismaAccountRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaAccountRepository(prisma);

  const ownerAId = `integration-owner-a-${randomUUID()}`;
  const ownerBId = `integration-owner-b-${randomUUID()}`;

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
    await prisma.account.deleteMany({ where: { userId: { in: [ownerAId, ownerBId] } } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [ownerAId, ownerBId] } } });
    await prisma.$disconnect();
  });

  it('persists an account and finds it by id for its owner', async () => {
    const account = Account.create({
      id: randomUUID(),
      userId: ownerAId,
      name: 'Main Checking',
      type: 'bank',
    });

    await repository.save(account);
    const found = await repository.findByIdForOwner(account.id, ownerAId);

    expect(found?.id).toBe(account.id);
    expect(found?.name).toBe('Main Checking');
    expect(found?.type).toBe('bank');
  });

  it('returns null when the account belongs to a different owner', async () => {
    const account = Account.create({
      id: randomUUID(),
      userId: ownerBId,
      name: "Owner B's account",
      type: 'cash',
    });
    await repository.save(account);

    const found = await repository.findByIdForOwner(account.id, ownerAId);

    expect(found).toBeNull();
  });

  it('lists only accounts owned by the given owner', async () => {
    const ownerAAccount = Account.create({
      id: randomUUID(),
      userId: ownerAId,
      name: "Owner A's account",
      type: 'bank',
    });
    const ownerBAccount = Account.create({
      id: randomUUID(),
      userId: ownerBId,
      name: "Owner B's account",
      type: 'cash',
    });
    await repository.save(ownerAAccount);
    await repository.save(ownerBAccount);

    const found = await repository.listForOwner(ownerAId);

    expect(found.map((a) => a.id)).toContain(ownerAAccount.id);
    expect(found.map((a) => a.id)).not.toContain(ownerBAccount.id);
  });

  it('deletes an account by id', async () => {
    const account = Account.create({
      id: randomUUID(),
      userId: ownerAId,
      name: 'To Delete',
      type: 'credit_card',
    });
    await repository.save(account);

    await repository.delete(account.id);

    expect(await repository.findByIdForOwner(account.id, ownerAId)).toBeNull();
  });
});
