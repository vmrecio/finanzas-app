process.env.DATABASE_URL ??=
  'postgresql://finanzas:finanzas@localhost:5432/finanzas?schema=public';

import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaRefreshTokenRepository } from './prisma-refresh-token.repository';

describe('PrismaRefreshTokenRepository (integration)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaRefreshTokenRepository(prisma);
  const userId = 'refresh-owner-1';

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.create({
      data: { id: userId, email: 'refresh-owner@example.com', passwordHash: '$argon2id$hash' },
    });
  });

  afterEach(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('persists a refresh token and finds it by hash', async () => {
    const saved = await repository.save({
      id: 'rt-1',
      userId,
      familyId: 'family-1',
      tokenHash: 'hash-1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: null,
      createdAt: new Date(),
    });

    expect(saved.id).toBe('rt-1');

    const found = await repository.findByTokenHash('hash-1');
    expect(found?.userId).toBe(userId);
    expect(found?.familyId).toBe('family-1');
    expect(found?.revokedAt).toBeNull();
  });

  it('returns null when no record matches the given hash', async () => {
    const found = await repository.findByTokenHash('does-not-exist');

    expect(found).toBeNull();
  });

  it('revoke() marks a single record as revoked', async () => {
    await repository.save({
      id: 'rt-2',
      userId,
      familyId: 'family-2',
      tokenHash: 'hash-2',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: null,
      createdAt: new Date(),
    });

    await repository.revoke('rt-2');
    const found = await repository.findByTokenHash('hash-2');

    expect(found?.revokedAt).not.toBeNull();
  });

  it('revokeFamily() marks every unrevoked record in the family as revoked', async () => {
    await repository.save({
      id: 'rt-3',
      userId,
      familyId: 'family-3',
      tokenHash: 'hash-3',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: null,
      createdAt: new Date(),
    });
    await repository.save({
      id: 'rt-4',
      userId,
      familyId: 'family-3',
      tokenHash: 'hash-4',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: null,
      createdAt: new Date(),
    });

    await repository.revokeFamily('family-3');

    const first = await repository.findByTokenHash('hash-3');
    const second = await repository.findByTokenHash('hash-4');
    expect(first?.revokedAt).not.toBeNull();
    expect(second?.revokedAt).not.toBeNull();
  });
});
