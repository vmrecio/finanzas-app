import { Inject, Injectable } from '@nestjs/common';
import { BudgetNotFoundError } from '../domain/errors';
import { BUDGET_REPOSITORY, type BudgetRepositoryPort } from './ports/budget-repository.port';

export interface DeleteBudgetInput {
  id: string;
  ownerId: string;
}

@Injectable()
export class DeleteBudgetUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY) private readonly budgetRepository: BudgetRepositoryPort,
  ) {}

  async execute(input: DeleteBudgetInput): Promise<void> {
    const existing = await this.budgetRepository.findByIdForOwner(input.id, input.ownerId);

    if (!existing) {
      throw new BudgetNotFoundError();
    }

    await this.budgetRepository.delete(existing.id);
  }
}
