import { Inject, Injectable } from '@nestjs/common';
import { Money } from '@finanzas/shared';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from '../../categories/application/ports/category-repository.port';
import { CategoryNotFoundError } from '../../categories/domain/errors';
import { Budget } from '../domain/budget.entity';
import { BudgetAlreadyExistsError, BudgetCategoryKindMismatchError, BudgetNotFoundError } from '../domain/errors';
import { toBudgetResult, type BudgetResult } from './create-budget.use-case';
import { BUDGET_ACTUALS, type BudgetActualsPort } from './ports/budget-actuals.port';
import { BUDGET_REPOSITORY, type BudgetRepositoryPort } from './ports/budget-repository.port';

export interface UpdateBudgetInput {
  id: string;
  ownerId: string;
  categoryId?: string;
  periodMonth?: string;
  limitCents?: number;
}

/**
 * Updating a budget re-runs the same category ownership/kind checks as
 * creation whenever the referenced category changes, and re-runs the
 * duplicate check whenever category or month changes — mirrors
 * `UpdateTransactionUseCase`/`UpdateCategoryUseCase`.
 */
@Injectable()
export class UpdateBudgetUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepository: BudgetRepositoryPort,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
    @Inject(BUDGET_ACTUALS) private readonly budgetActuals: BudgetActualsPort,
  ) {}

  async execute(input: UpdateBudgetInput): Promise<BudgetResult> {
    const existing = await this.budgetRepository.findByIdForOwner(input.id, input.ownerId);
    if (!existing) {
      throw new BudgetNotFoundError();
    }

    const categoryId = input.categoryId ?? existing.categoryId;
    const periodMonth = input.periodMonth ?? existing.periodMonth;

    if (input.categoryId !== undefined) {
      const category = await this.categoryRepository.findByIdForOwner(categoryId, input.ownerId);
      if (!category) {
        throw new CategoryNotFoundError();
      }
      if (category.kind !== 'expense') {
        throw new BudgetCategoryKindMismatchError();
      }
    }

    if (input.categoryId !== undefined || input.periodMonth !== undefined) {
      const conflicting = await this.budgetRepository.findByUserCategoryAndMonth(
        input.ownerId,
        categoryId,
        periodMonth,
      );
      if (conflicting && conflicting.id !== existing.id) {
        throw new BudgetAlreadyExistsError();
      }
    }

    const updated = Budget.create({
      id: existing.id,
      userId: existing.userId,
      categoryId,
      periodMonth,
      limit: input.limitCents !== undefined ? Money.fromCents(input.limitCents) : existing.limit,
    });
    const saved = await this.budgetRepository.save(updated);
    const actualCents = await this.budgetActuals.getActualExpenseCents(
      input.ownerId,
      saved.categoryId,
      saved.periodMonth,
    );

    return toBudgetResult(saved, actualCents);
  }
}
