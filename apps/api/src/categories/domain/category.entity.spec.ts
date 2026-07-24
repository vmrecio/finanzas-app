import { Category } from './category.entity';

describe('Category', () => {
  describe('create', () => {
    it('creates a Category with the given id, userId, trimmed name, and kind', () => {
      const category = Category.create({
        id: 'category-1',
        userId: 'user-1',
        name: '  Groceries  ',
        kind: 'expense',
      });

      expect(category.id).toBe('category-1');
      expect(category.userId).toBe('user-1');
      expect(category.name).toBe('Groceries');
      expect(category.kind).toBe('expense');
    });

    it('accepts the income kind', () => {
      const category = Category.create({
        id: 'category-2',
        userId: 'user-1',
        name: 'Salary',
        kind: 'income',
      });

      expect(category.kind).toBe('income');
    });

    it('rejects an empty name', () => {
      expect(() =>
        Category.create({ id: 'category-3', userId: 'user-1', name: '   ', kind: 'expense' }),
      ).toThrow('Category name must not be empty');
    });

    it('rejects a kind that is not income or expense', () => {
      expect(() =>
        Category.create({
          id: 'category-4',
          userId: 'user-1',
          name: 'Weird',
          // @ts-expect-error deliberately invalid kind to prove the runtime guard
          kind: 'transfer',
        }),
      ).toThrow('Category kind must be one of: income, expense');
    });
  });
});
