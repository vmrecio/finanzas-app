import { NoTransactionsYetAdapter } from './no-transactions-yet.adapter';

describe('NoTransactionsYetAdapter', () => {
  it('always reports that no transactions exist for any account (Phase 3 stand-in)', async () => {
    const adapter = new NoTransactionsYetAdapter();

    await expect(adapter.existsForAccount('any-account-id')).resolves.toBe(false);
  });
});
