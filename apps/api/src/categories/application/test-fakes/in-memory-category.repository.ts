import type { Category, CategoryKind } from '../../domain/category.entity';
import type { CategoryRepositoryPort } from '../ports/category-repository.port';

/**
 * In-memory fake used to test application-layer use cases without a real
 * database (see design.md "Testing Strategy"). Holds multi-owner data so
 * ownership isolation is provable in fast, DB-free tests.
 */
export class InMemoryCategoryRepository implements CategoryRepositoryPort {
  private readonly categoriesById = new Map<string, Category>();

  async findByIdForOwner(id: string, ownerId: string): Promise<Category | null> {
    const category = this.categoriesById.get(id);
    if (!category || category.userId !== ownerId) {
      return null;
    }
    return category;
  }

  async findByNameAndKindForOwner(
    name: string,
    kind: CategoryKind,
    ownerId: string,
  ): Promise<Category | null> {
    for (const category of this.categoriesById.values()) {
      if (category.userId === ownerId && category.name === name && category.kind === kind) {
        return category;
      }
    }
    return null;
  }

  async listForOwner(ownerId: string): Promise<Category[]> {
    return [...this.categoriesById.values()].filter((category) => category.userId === ownerId);
  }

  async save(category: Category): Promise<Category> {
    this.categoriesById.set(category.id, category);
    return category;
  }

  async delete(id: string): Promise<void> {
    this.categoriesById.delete(id);
  }

  get size(): number {
    return this.categoriesById.size;
  }
}
