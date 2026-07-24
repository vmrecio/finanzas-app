import { Category } from '../domain/category.entity';
import { CategoryAlreadyExistsError, CategoryNotFoundError } from '../domain/errors';
import { InMemoryCategoryRepository } from './test-fakes/in-memory-category.repository';
import { UpdateCategoryUseCase } from './update-category.use-case';

describe('UpdateCategoryUseCase', () => {
  function setup(): { useCase: UpdateCategoryUseCase; repository: InMemoryCategoryRepository } {
    const repository = new InMemoryCategoryRepository();
    const useCase = new UpdateCategoryUseCase(repository);
    return { useCase, repository };
  }

  it('updates the name of a category owned by the requesting user', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-1', name: 'Old Name', kind: 'expense' }),
    );

    const result = await useCase.execute({ id: 'c1', ownerId: 'user-1', name: 'New Name' });

    expect(result.name).toBe('New Name');
    expect(result.kind).toBe('expense');
    const stored = await repository.findByIdForOwner('c1', 'user-1');
    expect(stored?.name).toBe('New Name');
  });

  it('allows renaming a category to its own current name and kind (no-op is not a conflict)', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-1', name: 'Groceries', kind: 'expense' }),
    );

    const result = await useCase.execute({ id: 'c1', ownerId: 'user-1', name: 'Groceries', kind: 'expense' });

    expect(result.name).toBe('Groceries');
  });

  it('rejects renaming to a name+kind that already belongs to another category of the same owner', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-1', name: 'Groceries', kind: 'expense' }),
    );
    await repository.save(
      Category.create({ id: 'c2', userId: 'user-1', name: 'Dining', kind: 'expense' }),
    );

    await expect(
      useCase.execute({ id: 'c2', ownerId: 'user-1', name: 'Groceries' }),
    ).rejects.toThrow(CategoryAlreadyExistsError);
  });

  it('throws CategoryNotFoundError when the category does not exist', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ id: 'missing', ownerId: 'user-1', name: 'Whatever' }),
    ).rejects.toThrow(CategoryNotFoundError);
  });

  it('throws CategoryNotFoundError and leaves the category untouched when owned by a different owner', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-2', name: 'Original', kind: 'expense' }),
    );

    await expect(
      useCase.execute({ id: 'c1', ownerId: 'user-1', name: 'Hijacked' }),
    ).rejects.toThrow(CategoryNotFoundError);

    const stored = await repository.findByIdForOwner('c1', 'user-2');
    expect(stored?.name).toBe('Original');
  });
});
