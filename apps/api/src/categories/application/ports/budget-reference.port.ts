/**
 * Delete-guard dependency for categories: the Category deletion use case
 * must also refuse to delete a category still referenced by a budget (see
 * `budgets.category_id`'s `ON DELETE RESTRICT` FK in
 * prisma/migrations/20260725131814_add_budgets/migration.sql). Without this
 * check, a category with a budget but zero transactions would pass the
 * `TransactionReferencePort` guard and then fail on the raw Postgres FK
 * constraint during `categoryRepository.delete()`, surfacing as an
 * unhandled 500 instead of a clean 409 (see GitHub issue #17). Mirrors
 * `TransactionReferencePort` exactly.
 */
export interface BudgetReferencePort {
  existsForCategory(categoryId: string): Promise<boolean>;
}

export const BUDGET_REFERENCE = Symbol('BUDGET_REFERENCE');
