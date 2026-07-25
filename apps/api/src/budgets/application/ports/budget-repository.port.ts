import type { Budget } from '../../domain/budget.entity';

/**
 * Owner-scoped repository port for Budget. There is no un-scoped
 * `findById` — every read/write that targets a specific budget MUST go
 * through `findByIdForOwner` so cross-owner access is structurally
 * impossible to forget (see design.md "Ownership scoping / data isolation").
 */
export interface BudgetRepositoryPort {
  findByIdForOwner(id: string, ownerId: string): Promise<Budget | null>;
  findByUserCategoryAndMonth(
    ownerId: string,
    categoryId: string,
    periodMonth: string,
  ): Promise<Budget | null>;
  listForOwner(ownerId: string): Promise<Budget[]>;
  save(budget: Budget): Promise<Budget>;
  delete(id: string): Promise<void>;
}

export const BUDGET_REPOSITORY = Symbol('BUDGET_REPOSITORY');
