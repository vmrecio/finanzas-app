import { Inject, Injectable } from '@nestjs/common';
import { toBudgetResult, type BudgetResult } from './create-budget.use-case';
import { BUDGET_ACTUALS, type BudgetActualsPort } from './ports/budget-actuals.port';
import { BUDGET_REPOSITORY, type BudgetRepositoryPort } from './ports/budget-repository.port';

export interface ListBudgetsInput {
  ownerId: string;
}

@Injectable()
export class ListBudgetsUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepository: BudgetRepositoryPort,
    @Inject(BUDGET_ACTUALS) private readonly budgetActuals: BudgetActualsPort,
  ) {}

  async execute(input: ListBudgetsInput): Promise<BudgetResult[]> {
    const budgets = await this.budgetRepository.listForOwner(input.ownerId);

    return Promise.all(
      budgets.map(async (budget) => {
        const actualCents = await this.budgetActuals.getActualExpenseCents(
          input.ownerId,
          budget.categoryId,
          budget.periodMonth,
        );
        return toBudgetResult(budget, actualCents);
      }),
    );
  }
}
