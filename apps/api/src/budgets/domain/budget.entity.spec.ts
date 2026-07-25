import { Money } from '@finanzas/shared';
import { Budget } from './budget.entity';

describe('Budget', () => {
  describe('create', () => {
    it('creates a Budget with the given id, userId, categoryId, periodMonth, and limit', () => {
      const budget = Budget.create({
        id: 'budget-1',
        userId: 'user-1',
        categoryId: 'category-1',
        periodMonth: '2026-07',
        limit: Money.fromCents(50000),
      });

      expect(budget.id).toBe('budget-1');
      expect(budget.userId).toBe('user-1');
      expect(budget.categoryId).toBe('category-1');
      expect(budget.periodMonth).toBe('2026-07');
      expect(budget.limit.amountCents).toBe(50000);
    });

    it('rejects a periodMonth that is not in YYYY-MM format', () => {
      expect(() =>
        Budget.create({
          id: 'budget-2',
          userId: 'user-1',
          categoryId: 'category-1',
          periodMonth: '2026-7',
          limit: Money.fromCents(50000),
        }),
      ).toThrow('Budget periodMonth must be in YYYY-MM format');
    });

    it('rejects a periodMonth with an invalid month number', () => {
      expect(() =>
        Budget.create({
          id: 'budget-3',
          userId: 'user-1',
          categoryId: 'category-1',
          periodMonth: '2026-13',
          limit: Money.fromCents(50000),
        }),
      ).toThrow('Budget periodMonth must be in YYYY-MM format');
    });

    it('rejects a zero limit', () => {
      expect(() =>
        Budget.create({
          id: 'budget-4',
          userId: 'user-1',
          categoryId: 'category-1',
          periodMonth: '2026-07',
          limit: Money.fromCents(0),
        }),
      ).toThrow('Budget limit must be a positive number of cents');
    });

    it('rejects a negative limit', () => {
      expect(() =>
        Budget.create({
          id: 'budget-5',
          userId: 'user-1',
          categoryId: 'category-1',
          periodMonth: '2026-07',
          limit: Money.fromCents(-100),
        }),
      ).toThrow('Budget limit must be a positive number of cents');
    });
  });
});
