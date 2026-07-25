// Cross-owner access resolves to the SAME outcome as "does not exist" (see
// design.md "Ownership scoping / data isolation" — we deliberately avoid 403
// to prevent existence leakage/enumeration).
export class BudgetNotFoundError extends Error {
  constructor() {
    super('Budget not found');
    this.name = 'BudgetNotFoundError';
  }
}

export class BudgetAlreadyExistsError extends Error {
  constructor() {
    super('A budget for this category and month already exists for this user');
    this.name = 'BudgetAlreadyExistsError';
  }
}

/**
 * Cross-aggregate invariant violation: a budget was requested against a
 * category whose kind is not "expense" (see design.md "Invariants" —
 * "budgets only on expense categories"). This is a validation error, not an
 * ownership violation, so it is mapped to 400 Bad Request at the HTTP
 * boundary rather than 404 — mirrors
 * `TransactionCategoryKindMismatchError`.
 */
export class BudgetCategoryKindMismatchError extends Error {
  constructor() {
    super('Budgets can only be created for expense categories');
    this.name = 'BudgetCategoryKindMismatchError';
  }
}
