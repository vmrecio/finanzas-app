import { Injectable } from '@nestjs/common';
import type { BudgetReferencePort } from '../../application/ports/budget-reference.port';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Real Prisma-backed implementation of `BudgetReferencePort`, querying the
 * `budgets` table directly by `categoryId`. Guards `DeleteCategoryUseCase`
 * against the `budgets.category_id` ON DELETE RESTRICT FK (see GitHub issue
 * #17). Mirrors `PrismaTransactionReferenceAdapter` exactly.
 */
@Injectable()
export class PrismaBudgetReferenceAdapter implements BudgetReferencePort {
  constructor(private readonly prisma: PrismaService) {}

  async existsForCategory(categoryId: string): Promise<boolean> {
    const count = await this.prisma.budget.count({ where: { categoryId } });
    return count > 0;
  }
}
