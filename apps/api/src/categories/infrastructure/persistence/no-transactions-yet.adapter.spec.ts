import { NoTransactionsYetAdapter } from './no-transactions-yet.adapter';

describe('NoTransactionsYetAdapter', () => {
  it('always reports that no category is referenced by a transaction (Phase 4 stand-in)', async () => {
    const adapter = new NoTransactionsYetAdapter();

    await expect(adapter.existsForCategory('any-category-id')).resolves.toBe(false);
  });
});
