import { Account } from './account.entity';

describe('Account', () => {
  describe('create', () => {
    it('creates an Account with the given id, userId, trimmed name, and type', () => {
      const account = Account.create({
        id: 'account-1',
        userId: 'user-1',
        name: '  Main Checking  ',
        type: 'bank',
      });

      expect(account.id).toBe('account-1');
      expect(account.userId).toBe('user-1');
      expect(account.name).toBe('Main Checking');
      expect(account.type).toBe('bank');
    });

    it('defaults createdAt to now when not provided', () => {
      const before = Date.now();
      const account = Account.create({
        id: 'account-2',
        userId: 'user-1',
        name: 'Cash Wallet',
        type: 'cash',
      });
      const after = Date.now();

      expect(account.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(account.createdAt.getTime()).toBeLessThanOrEqual(after);
    });

    it('accepts an explicit createdAt (e.g. when rehydrating from persistence)', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const account = Account.create({
        id: 'account-3',
        userId: 'user-1',
        name: 'Credit Card',
        type: 'credit_card',
        createdAt,
      });

      expect(account.createdAt).toEqual(createdAt);
    });

    it('rejects an empty name', () => {
      expect(() =>
        Account.create({ id: 'account-4', userId: 'user-1', name: '   ', type: 'bank' }),
      ).toThrow('Account name must not be empty');
    });

    it('rejects a type that is not one of bank, cash, or credit_card', () => {
      expect(() =>
        Account.create({
          id: 'account-5',
          userId: 'user-1',
          name: 'Weird',
          // @ts-expect-error deliberately invalid type to prove the runtime guard
          type: 'crypto_wallet',
        }),
      ).toThrow('Account type must be one of: bank, cash, credit_card');
    });
  });
});
