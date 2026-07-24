import { Injectable } from '@nestjs/common';
import type {
  RefreshTokenRecord,
  RefreshTokenRepositoryPort,
} from '../../application/ports/refresh-token-repository.port';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(record: RefreshTokenRecord): Promise<RefreshTokenRecord> {
    await this.prisma.refreshToken.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        userId: record.userId,
        familyId: record.familyId,
        tokenHash: record.tokenHash,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt,
        createdAt: record.createdAt,
      },
      update: {
        revokedAt: record.revokedAt,
      },
    });
    return record;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    return record ? this.toDomain(record) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private toDomain(record: {
    id: string;
    userId: string;
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
  }): RefreshTokenRecord {
    return { ...record };
  }
}
