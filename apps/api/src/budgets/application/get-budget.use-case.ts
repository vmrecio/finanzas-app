import { Inject, Injectable } from '@nestjs/common';
import { BudgetNotFoundError } from '../domain/errors';
import { toBudgetResult, type BudgetResult } from './create-budget.use-case';
import { BUDGET_ACTUALS, type BudgetActualsPort } from './ports/budget-actuals.port';
import { BUDGET_REPOSITORY, type BudgetRepositoryPort } from './ports/budget-repository.port';

export interface GetBudgetInput {
  id: string;
  ownerId: string;
}

@Injectable()
export class GetBudgetUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepository: BudgetRepositoryPort,
    @Inject(BUDGET_ACTUALS) private readonly budgetActuals: BudgetActualsPort,
  ) {}

  async execute(input: GetBudgetInput): Promise<BudgetResult> {
    const budget = await this.budgetRepository.findByIdForOwner(input.id, input.ownerId);

    if (!budget) {
      throw new BudgetNotFoundError();
    }

    const actualCents = await this.budgetActuals.getActualExpenseCents(
      input.ownerId,
      budget.categoryId,
      budget.periodMonth,
    );

    return toBudgetResult(budget, actualCents);
  }
}
