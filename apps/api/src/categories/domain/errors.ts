// Cross-owner access resolves to the SAME outcome as "does not exist" (see
// design.md "Ownership scoping / data isolation" — we deliberately avoid 403
// to prevent existence leakage/enumeration).
export class CategoryNotFoundError extends Error {
  constructor() {
    super('Category not found');
    this.name = 'CategoryNotFoundError';
  }
}

export class CategoryAlreadyExistsError extends Error {
  constructor() {
    super('A category with this name and kind already exists for this user');
    this.name = 'CategoryAlreadyExistsError';
  }
}

export class CategoryHasTransactionsError extends Error {
  constructor() {
    super('Cannot delete a category that is referenced by existing transactions');
    this.name = 'CategoryHasTransactionsError';
  }
}

// Distinct from CategoryHasTransactionsError so the client can tell *why*
// deletion was blocked (see GitHub issue #17 — `budgets.category_id` has an
// ON DELETE RESTRICT FK; without this guard the delete falls through to a
// raw, unhandled Postgres constraint violation). Both errors map to the
// same 409 Conflict at the HTTP boundary (see CategoriesController.mapError).
export class CategoryHasBudgetsError extends Error {
  constructor() {
    super('Cannot delete a category that is referenced by existing budgets');
    this.name = 'CategoryHasBudgetsError';
  }
}
