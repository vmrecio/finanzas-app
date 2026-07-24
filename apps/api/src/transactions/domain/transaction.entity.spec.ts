import { Money } from '@finanzas/shared';
import { Transaction } from './transaction.entity';

describe('Transaction', () => {
  describe('create', () => {
    it('creates a Transaction with the given id, userId, refs, type, amount, occurredOn, and trimmed note', () => {
      const occurredOn = new Date('2026-07-01T00:00:00.000Z');
      const transaction = Transaction.create({
        id: 'tx-1',
        userId: 'user-1',
        accountId: 'account-1',
        categoryId: 'category-1',
        type: 'expense',
        amount: Money.fromCents(3000),
        occurredOn,
        note: '  Groceries run  ',
      });

      expect(transaction.id).toBe('tx-1');
      expect(transaction.userId).toBe('user-1');
      expect(transaction.accountId).toBe('account-1');
      expect(transaction.categoryId).toBe('category-1');
      expect(transaction.type).toBe('expense');
      expect(transaction.amount.amountCents).toBe(3000);
      expect(transaction.occurredOn).toEqual(occurredOn);
      expect(transaction.note).toBe('Groceries run');
    });

    it('defaults note to null when omitted', () => {
      const transaction = Transaction.create({
        id: 'tx-2',
        userId: 'user-1',
        accountId: 'account-1',
        categoryId: 'category-1',
        type: 'income',
        amount: Money.fromCents(10000),
        occurredOn: new Date('2026-07-02T00:00:00.000Z'),
      });

      expect(transaction.note).toBeNull();
    });

    it('defaults note to null when it is an empty/whitespace-only string', () => {
      const transaction = Transaction.create({
        id: 'tx-3',
        userId: 'user-1',
        accountId: 'account-1',
        categoryId: 'category-1',
        type: 'income',
        amount: Money.fromCents(500),
        occurredOn: new Date('2026-07-03T00:00:00.000Z'),
        note: '   ',
      });

      expect(transaction.note).toBeNull();
    });

    it('rejects a zero amount', () => {
      expect(() =>
        Transaction.create({
          id: 'tx-4',
          userId: 'user-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          type: 'expense',
          amount: Money.fromCents(0),
          occurredOn: new Date('2026-07-04T00:00:00.000Z'),
        }),
      ).toThrow('Transaction amount must be a positive number of cents');
    });

    it('rejects a negative amount', () => {
      expect(() =>
        Transaction.create({
          id: 'tx-5',
          userId: 'user-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          type: 'expense',
          amount: Money.fromCents(-500),
          occurredOn: new Date('2026-07-05T00:00:00.000Z'),
        }),
      ).toThrow('Transaction amount must be a positive number of cents');
    });

    it('rejects a type that is not income or expense', () => {
      expect(() =>
        Transaction.create({
          id: 'tx-6',
          userId: 'user-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          // @ts-expect-error deliberately invalid type to prove the runtime guard
          type: 'transfer',
          amount: Money.fromCents(100),
          occurredOn: new Date('2026-07-06T00:00:00.000Z'),
        }),
      ).toThrow('Transaction type must be one of: income, expense');
    });
  });
});
