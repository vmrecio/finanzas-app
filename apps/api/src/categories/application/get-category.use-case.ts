import { Inject, Injectable } from '@nestjs/common';
import { CategoryNotFoundError } from '../domain/errors';
import { CATEGORY_REPOSITORY, type CategoryRepositoryPort } from './ports/category-repository.port';
import type { CategoryResult } from './create-category.use-case';

export interface GetCategoryInput {
  id: string;
  ownerId: string;
}

@Injectable()
export class GetCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(input: GetCategoryInput): Promise<CategoryResult> {
    const category = await this.categoryRepository.findByIdForOwner(input.id, input.ownerId);

    if (!category) {
      throw new CategoryNotFoundError();
    }

    return { id: category.id, name: category.name, kind: category.kind };
  }
}
