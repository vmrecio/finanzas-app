process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { User } from '../../domain/user.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaUserRepository } from './prisma-user.repository';

// Integration tier: exercises the real Postgres instance from
// docker-compose (see design.md "Testing Strategy" — infrastructure tests
// run against real Postgres, not fakes).
describe('PrismaUserRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaUserRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  const fixtureUserIds = ['integration-user-1', 'integration-user-2'];

  afterEach(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId: { in: fixtureUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: fixtureUserIds } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persists a user and finds it by email', async () => {
    const user = User.register({
      id: 'integration-user-1',
      email: 'integration@example.com',
      passwordHash: '$argon2id$fake-hash',
    });

    await repository.save(user);
    const found = await repository.findByEmail('integration@example.com');

    expect(found?.id).toBe('integration-user-1');
    expect(found?.email).toBe('integration@example.com');
    expect(found?.passwordHash).toBe('$argon2id$fake-hash');
  });

  it('returns null when no user exists with the given email', async () => {
    const found = await repository.findByEmail('nobody@example.com');

    expect(found).toBeNull();
  });

  it('finds a persisted user by id', async () => {
    const user = User.register({
      id: 'integration-user-2',
      email: 'byid@example.com',
      passwordHash: '$argon2id$fake-hash',
    });
    await repository.save(user);

    const found = await repository.findById('integration-user-2');

    expect(found?.email).toBe('byid@example.com');
  });

  it('returns null when finding by an id that does not exist', async () => {
    const found = await repository.findById('does-not-exist');

    expect(found).toBeNull();
  });
});
