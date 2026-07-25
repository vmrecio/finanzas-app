import { Injectable } from '@nestjs/common';
import { Money } from '@finanzas/shared';
import type {
  TransactionListFilter,
  TransactionRepositoryPort,
} from '../../application/ports/transaction-repository.port';
import { Transaction, type TransactionType } from '../../domain/transaction.entity';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

interface TransactionRecord {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  type: string;
  amountCents: bigint;
  occurredOn: Date;
  note: string | null;
}

@Injectable()
export class PrismaTransactionRepository implements TransactionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdForOwner(id: string, ownerId: string): Promise<Transaction | null> {
    const record = await this.prisma.transaction.findFirst({ where: { id, userId: ownerId } });
    return record ? this.toDomain(record) : null;
  }

  async listForOwner(ownerId: string, filter?: TransactionListFilter): Promise<Transaction[]> {
    const records = await this.prisma.transaction.findMany({
      where: {
        userId: ownerId,
        ...(filter?.accountId !== undefined ? { accountId: filter.accountId } : {}),
        ...(filter?.categoryId !== undefined ? { categoryId: filter.categoryId } : {}),
        ...(filter?.fromDate !== undefined || filter?.toDate !== undefined
          ? {
              occurredOn: {
                ...(filter?.fromDate !== undefined ? { gte: filter.fromDate } : {}),
                ...(filter?.toDate !== undefined ? { lte: filter.toDate } : {}),
              },
            }
          : {}),
      },
    });
    return records.map((record) => this.toDomain(record));
  }

  async save(transaction: Transaction): Promise<Transaction> {
    await this.prisma.transaction.upsert({
      where: { id: transaction.id },
      create: {
        id: transaction.id,
        userId: transaction.userId,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        type: transaction.type,
        amountCents: BigInt(transaction.amount.amountCents),
        occurredOn: transaction.occurredOn,
        note: transaction.note,
      },
      update: {
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        type: transaction.type,
        amountCents: BigInt(transaction.amount.amountCents),
        occurredOn: transaction.occurredOn,
        note: transaction.note,
      },
    });
    return transaction;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.transaction.delete({ where: { id } });
  }

  private toDomain(record: TransactionRecord): Transaction {
    return Transaction.create({
      id: record.id,
      userId: record.userId,
      accountId: record.accountId,
      categoryId: record.categoryId,
      type: record.type as TransactionType,
      amount: Money.fromCents(Number(record.amountCents)),
      occurredOn: record.occurredOn,
      note: record.note,
    });
  }
}
