// Cross-owner access resolves to the SAME outcome as "does not exist" (see
// design.md "Ownership scoping / data isolation" — we deliberately avoid 403
// to prevent existence leakage/enumeration).
export class TransactionNotFoundError extends Error {
  constructor() {
    super('Transaction not found');
    this.name = 'TransactionNotFoundError';
  }
}

/**
 * Cross-aggregate invariant violation: the referenced category's kind does
 * not match the transaction's type (see design.md "Invariants" — "category.kind
 * matches transaction.type"). This is a validation error, not an ownership
 * violation, so it is mapped to 400 Bad Request at the HTTP boundary rather
 * than 404.
 */
export class TransactionCategoryKindMismatchError extends Error {
  constructor() {
    super("Transaction type must match its category's kind");
    this.name = 'TransactionCategoryKindMismatchError';
  }
}
