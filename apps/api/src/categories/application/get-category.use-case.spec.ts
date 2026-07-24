import { Category } from '../domain/category.entity';
import { CategoryNotFoundError } from '../domain/errors';
import { InMemoryCategoryRepository } from './test-fakes/in-memory-category.repository';
import { GetCategoryUseCase } from './get-category.use-case';

describe('GetCategoryUseCase', () => {
  function setup(): { useCase: GetCategoryUseCase; repository: InMemoryCategoryRepository } {
    const repository = new InMemoryCategoryRepository();
    const useCase = new GetCategoryUseCase(repository);
    return { useCase, repository };
  }

  it('returns a category owned by the requesting user', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-1', name: 'Groceries', kind: 'expense' }),
    );

    const result = await useCase.execute({ id: 'c1', ownerId: 'user-1' });

    expect(result.name).toBe('Groceries');
  });

  it('throws CategoryNotFoundError when the category does not exist', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ id: 'missing', ownerId: 'user-1' })).rejects.toThrow(
      CategoryNotFoundError,
    );
  });

  it('throws CategoryNotFoundError (never exposes) when the category belongs to a different owner', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-2', name: "Owner B's category", kind: 'expense' }),
    );

    await expect(useCase.execute({ id: 'c1', ownerId: 'user-1' })).rejects.toThrow(
      CategoryNotFoundError,
    );
  });
});
