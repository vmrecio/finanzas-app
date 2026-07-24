import { Injectable } from '@nestjs/common';
import type { UserRepositoryPort } from '../../application/ports/user-repository.port';
import { User } from '../../domain/user.entity';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async save(user: User): Promise<User> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
      },
      update: {
        email: user.email,
        passwordHash: user.passwordHash,
      },
    });
    return user;
  }

  private toDomain(record: {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
  }): User {
    return User.register({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      createdAt: record.createdAt,
    });
  }
}
