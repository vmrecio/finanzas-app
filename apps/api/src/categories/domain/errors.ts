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
