import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Money } from '@finanzas/shared';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from '../../categories/application/ports/category-repository.port';
import { CategoryNotFoundError } from '../../categories/domain/errors';
import { Budget } from '../domain/budget.entity';
import { BudgetAlreadyExistsError, BudgetCategoryKindMismatchError } from '../domain/errors';
import { BUDGET_ACTUALS, type BudgetActualsPort } from './ports/budget-actuals.port';
import { BUDGET_REPOSITORY, type BudgetRepositoryPort } from './ports/budget-repository.port';

export interface CreateBudgetInput {
  ownerId: string;
  categoryId: string;
  periodMonth: string;
  limitCents: number;
}

export interface BudgetResult {
  id: string;
  categoryId: string;
  periodMonth: string;
  limitCents: number;
  actualCents: number;
  exceeded: boolean;
}

export function toBudgetResult(budget: Budget, actualCents: number): BudgetResult {
  return {
    id: budget.id,
    categoryId: budget.categoryId,
    periodMonth: budget.periodMonth,
    limitCents: budget.limit.amountCents,
    actualCents,
    exceeded: actualCents > budget.limit.amountCents,
  };
}

/**
 * Creating a budget requires the referenced category to belong to the same
 * owner AND be an expense category (see design.md "Invariants" — "budgets
 * only on expense categories"). Reuses `CategoryNotFoundError` for a
 * missing/cross-owner category reference, exactly like
 * `CreateTransactionUseCase` reuses `AccountNotFoundError`/
 * `CategoryNotFoundError` — no new cross-owner leakage surface. Unlike
 * `CreateAccountUseCase` (which hardcodes balance 0 because a brand-new
 * account cannot yet have transactions), a budget's category may already
 * have matching expense transactions in that month before the budget was
 * created, so `actualCents`/`exceeded` are computed here too (see spec.md
 * "Actual-vs-Limit Calculation" — computed "on read").
 */
@Injectable()
export class CreateBudgetUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepository: BudgetRepositoryPort,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
    @Inject(BUDGET_ACTUALS) private readonly budgetActuals: BudgetActualsPort,
  ) {}

  async execute(input: CreateBudgetInput): Promise<BudgetResult> {
    const category = await this.categoryRepository.findByIdForOwner(input.categoryId, input.ownerId);
    if (!category) {
      throw new CategoryNotFoundError();
    }
    if (category.kind !== 'expense') {
      throw new BudgetCategoryKindMismatchError();
    }

    const existing = await this.budgetRepository.findByUserCategoryAndMonth(
      input.ownerId,
      input.categoryId,
      input.periodMonth,
    );
    if (existing) {
      throw new BudgetAlreadyExistsError();
    }

    const budget = Budget.create({
      id: randomUUID(),
      userId: input.ownerId,
      categoryId: input.categoryId,
      periodMonth: input.periodMonth,
      limit: Money.fromCents(input.limitCents),
    });
    const saved = await this.budgetRepository.save(budget);
    const actualCents = await this.budgetActuals.getActualExpenseCents(
      input.ownerId,
      saved.categoryId,
      saved.periodMonth,
    );

    return toBudgetResult(saved, actualCents);
  }
}
