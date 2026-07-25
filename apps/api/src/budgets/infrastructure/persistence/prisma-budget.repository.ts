import { Injectable } from '@nestjs/common';
import { Money } from '@finanzas/shared';
import type { BudgetRepositoryPort } from '../../application/ports/budget-repository.port';
import { Budget } from '../../domain/budget.entity';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

interface BudgetRecord {
  id: string;
  userId: string;
  categoryId: string;
  periodMonth: string;
  limitCents: bigint;
}

@Injectable()
export class PrismaBudgetRepository implements BudgetRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdForOwner(id: string, ownerId: string): Promise<Budget | null> {
    const record = await this.prisma.budget.findFirst({ where: { id, userId: ownerId } });
    return record ? this.toDomain(record) : null;
  }

  async findByUserCategoryAndMonth(
    ownerId: string,
    categoryId: string,
    periodMonth: string,
  ): Promise<Budget | null> {
    const record = await this.prisma.budget.findFirst({
      where: { userId: ownerId, categoryId, periodMonth },
    });
    return record ? this.toDomain(record) : null;
  }

  async listForOwner(ownerId: string): Promise<Budget[]> {
    const records = await this.prisma.budget.findMany({ where: { userId: ownerId } });
    return records.map((record) => this.toDomain(record));
  }

  async save(budget: Budget): Promise<Budget> {
    await this.prisma.budget.upsert({
      where: { id: budget.id },
      create: {
        id: budget.id,
        userId: budget.userId,
        categoryId: budget.categoryId,
        periodMonth: budget.periodMonth,
        limitCents: BigInt(budget.limit.amountCents),
      },
      update: {
        categoryId: budget.categoryId,
        periodMonth: budget.periodMonth,
        limitCents: BigInt(budget.limit.amountCents),
      },
    });
    return budget;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.budget.delete({ where: { id } });
  }

  private toDomain(record: BudgetRecord): Budget {
    return Budget.create({
      id: record.id,
      userId: record.userId,
      categoryId: record.categoryId,
      periodMonth: record.periodMonth,
      limit: Money.fromCents(Number(record.limitCents)),
    });
  }
}
