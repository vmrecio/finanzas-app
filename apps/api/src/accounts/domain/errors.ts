// Cross-owner access resolves to the SAME outcome as "does not exist" (see
// design.md "Ownership scoping / data isolation" — we deliberately avoid 403
// to prevent existence leakage/enumeration).
export class AccountNotFoundError extends Error {
  constructor() {
    super('Account not found');
    this.name = 'AccountNotFoundError';
  }
}

export class AccountHasTransactionsError extends Error {
  constructor() {
    super('Cannot delete an account that has existing transactions');
    this.name = 'AccountHasTransactionsError';
  }
}
