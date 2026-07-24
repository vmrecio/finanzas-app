import { Inject, Injectable } from '@nestjs/common';
import { Category, type CategoryKind } from '../domain/category.entity';
import { CategoryAlreadyExistsError, CategoryNotFoundError } from '../domain/errors';
import { CATEGORY_REPOSITORY, type CategoryRepositoryPort } from './ports/category-repository.port';
import type { CategoryResult } from './create-category.use-case';

export interface UpdateCategoryInput {
  id: string;
  ownerId: string;
  name?: string;
  kind?: CategoryKind;
}

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<CategoryResult> {
    const existing = await this.categoryRepository.findByIdForOwner(input.id, input.ownerId);

    if (!existing) {
      throw new CategoryNotFoundError();
    }

    const updated = Category.create({
      id: existing.id,
      userId: existing.userId,
      name: input.name ?? existing.name,
      kind: input.kind ?? existing.kind,
    });

    const conflicting = await this.categoryRepository.findByNameAndKindForOwner(
      updated.name,
      updated.kind,
      input.ownerId,
    );
    if (conflicting && conflicting.id !== existing.id) {
      throw new CategoryAlreadyExistsError();
    }

    const saved = await this.categoryRepository.save(updated);

    return { id: saved.id, name: saved.name, kind: saved.kind };
  }
}
