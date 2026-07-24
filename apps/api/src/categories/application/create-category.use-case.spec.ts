import { InMemoryCategoryRepository } from './test-fakes/in-memory-category.repository';
import { CreateCategoryUseCase } from './create-category.use-case';
import { CategoryAlreadyExistsError } from '../domain/errors';

describe('CreateCategoryUseCase', () => {
  function setup(): { useCase: CreateCategoryUseCase; repository: InMemoryCategoryRepository } {
    const repository = new InMemoryCategoryRepository();
    const useCase = new CreateCategoryUseCase(repository);
    return { useCase, repository };
  }

  it('creates a category owned by the requesting user', async () => {
    const { useCase, repository } = setup();

    const result = await useCase.execute({ ownerId: 'user-1', name: 'Groceries', kind: 'expense' });

    expect(result.name).toBe('Groceries');
    expect(result.kind).toBe('expense');
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);

    const stored = await repository.findByIdForOwner(result.id, 'user-1');
    expect(stored?.name).toBe('Groceries');
    expect(stored?.userId).toBe('user-1');
  });

  it('allows two different owners to create a category with the same name and kind independently', async () => {
    const { useCase, repository } = setup();

    const first = await useCase.execute({ ownerId: 'user-1', name: 'Salary', kind: 'income' });
    const second = await useCase.execute({ ownerId: 'user-2', name: 'Salary', kind: 'income' });

    expect(first.id).not.toBe(second.id);
    expect(repository.size).toBe(2);
  });

  it('rejects creating a duplicate name+kind for the same owner', async () => {
    const { useCase } = setup();
    await useCase.execute({ ownerId: 'user-1', name: 'Groceries', kind: 'expense' });

    await expect(
      useCase.execute({ ownerId: 'user-1', name: 'Groceries', kind: 'expense' }),
    ).rejects.toThrow(CategoryAlreadyExistsError);
  });

  it('allows the same owner to reuse the same name for a different kind', async () => {
    const { useCase, repository } = setup();
    await useCase.execute({ ownerId: 'user-1', name: 'Bonus', kind: 'income' });

    const second = await useCase.execute({ ownerId: 'user-1', name: 'Bonus', kind: 'expense' });

    expect(second.kind).toBe('expense');
    expect(repository.size).toBe(2);
  });
});
