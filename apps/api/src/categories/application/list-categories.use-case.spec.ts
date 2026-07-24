import { Category } from '../domain/category.entity';
import { InMemoryCategoryRepository } from './test-fakes/in-memory-category.repository';
import { ListCategoriesUseCase } from './list-categories.use-case';

describe('ListCategoriesUseCase', () => {
  function setup(): { useCase: ListCategoriesUseCase; repository: InMemoryCategoryRepository } {
    const repository = new InMemoryCategoryRepository();
    const useCase = new ListCategoriesUseCase(repository);
    return { useCase, repository };
  }

  it('lists only categories owned by the requesting user (ownership isolation)', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-1', name: 'Groceries', kind: 'expense' }),
    );
    await repository.save(
      Category.create({ id: 'c2', userId: 'user-1', name: 'Salary', kind: 'income' }),
    );
    await repository.save(
      Category.create({ id: 'b1', userId: 'user-2', name: 'Other Owner Category', kind: 'expense' }),
    );

    const result = await useCase.execute({ ownerId: 'user-1' });

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.name).sort()).toEqual(['Groceries', 'Salary']);
    expect(result.some((c) => c.name === 'Other Owner Category')).toBe(false);
  });

  it('returns an empty list when the owner has no categories', async () => {
    const { useCase } = setup();

    const result = await useCase.execute({ ownerId: 'nobody' });

    expect(result).toEqual([]);
  });
});
