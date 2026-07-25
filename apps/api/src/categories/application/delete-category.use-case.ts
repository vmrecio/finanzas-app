import { Inject, Injectable } from '@nestjs/common';
import {
  CategoryHasBudgetsError,
  CategoryHasTransactionsError,
  CategoryNotFoundError,
} from '../domain/errors';
import { BUDGET_REFERENCE, type BudgetReferencePort } from './ports/budget-reference.port';
import { CATEGORY_REPOSITORY, type CategoryRepositoryPort } from './ports/category-repository.port';
import {
  TRANSACTION_REFERENCE,
  type TransactionReferencePort,
} from './ports/transaction-reference.port';

export interface DeleteCategoryInput {
  id: string;
  ownerId: string;
}

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
    @Inject(TRANSACTION_REFERENCE) private readonly transactionReference: TransactionReferencePort,
    @Inject(BUDGET_REFERENCE) private readonly budgetReference: BudgetReferencePort,
  ) {}

  async execute(input: DeleteCategoryInput): Promise<void> {
    const existing = await this.categoryRepository.findByIdForOwner(input.id, input.ownerId);

    if (!existing) {
      throw new CategoryNotFoundError();
    }

    const hasTransactions = await this.transactionReference.existsForCategory(existing.id);
    if (hasTransactions) {
      throw new CategoryHasTransactionsError();
    }

    // Guards against the `budgets.category_id` ON DELETE RESTRICT FK (see
    // GitHub issue #17): a category with a budget but zero transactions must
    // be rejected here with a clean 409 rather than falling through to a raw
    // Postgres constraint violation on `categoryRepository.delete()`.
    const hasBudgets = await this.budgetReference.existsForCategory(existing.id);
    if (hasBudgets) {
      throw new CategoryHasBudgetsError();
    }

    await this.categoryRepository.delete(existing.id);
  }
}
