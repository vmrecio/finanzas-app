import { Injectable } from '@nestjs/common';
import type { AccountRepositoryPort } from '../../application/ports/account-repository.port';
import { Account, type AccountType } from '../../domain/account.entity';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

interface AccountRecord {
  id: string;
  userId: string;
  name: string;
  type: string;
  createdAt: Date;
}

@Injectable()
export class PrismaAccountRepository implements AccountRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdForOwner(id: string, ownerId: string): Promise<Account | null> {
    const record = await this.prisma.account.findFirst({ where: { id, userId: ownerId } });
    return record ? this.toDomain(record) : null;
  }

  async listForOwner(ownerId: string): Promise<Account[]> {
    const records = await this.prisma.account.findMany({ where: { userId: ownerId } });
    return records.map((record) => this.toDomain(record));
  }

  async save(account: Account): Promise<Account> {
    await this.prisma.account.upsert({
      where: { id: account.id },
      create: {
        id: account.id,
        userId: account.userId,
        name: account.name,
        type: account.type,
        createdAt: account.createdAt,
      },
      update: {
        name: account.name,
        type: account.type,
      },
    });
    return account;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.account.delete({ where: { id } });
  }

  private toDomain(record: AccountRecord): Account {
    return Account.create({
      id: record.id,
      userId: record.userId,
      name: record.name,
      type: record.type as AccountType,
      createdAt: record.createdAt,
    });
  }
}
