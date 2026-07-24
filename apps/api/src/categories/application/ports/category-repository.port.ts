import type { Category, CategoryKind } from '../../domain/category.entity';

/**
 * Owner-scoped repository port for Category. There is no un-scoped
 * `findById` — every read/write that targets a specific category MUST go
 * through `findByIdForOwner` so cross-owner access is structurally
 * impossible to forget (see design.md "Ownership scoping / data isolation").
 */
export interface CategoryRepositoryPort {
  findByIdForOwner(id: string, ownerId: string): Promise<Category | null>;
  findByNameAndKindForOwner(name: string, kind: CategoryKind, ownerId: string): Promise<Category | null>;
  listForOwner(ownerId: string): Promise<Category[]>;
  save(category: Category): Promise<Category>;
  delete(id: string): Promise<void>;
}

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');
