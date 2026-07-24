import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY, type CategoryRepositoryPort } from './ports/category-repository.port';
import type { CategoryResult } from './create-category.use-case';

export interface ListCategoriesInput {
  ownerId: string;
}

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(input: ListCategoriesInput): Promise<CategoryResult[]> {
    const categories = await this.categoryRepository.listForOwner(input.ownerId);

    return categories.map((category) => ({ id: category.id, name: category.name, kind: category.kind }));
  }
}
