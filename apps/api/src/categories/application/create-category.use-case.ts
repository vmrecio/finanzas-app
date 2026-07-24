import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Category, type CategoryKind } from '../domain/category.entity';
import { CategoryAlreadyExistsError } from '../domain/errors';
import { CATEGORY_REPOSITORY, type CategoryRepositoryPort } from './ports/category-repository.port';

export interface CreateCategoryInput {
  ownerId: string;
  name: string;
  kind: CategoryKind;
}

export interface CategoryResult {
  id: string;
  name: string;
  kind: CategoryKind;
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(input: CreateCategoryInput): Promise<CategoryResult> {
    const category = Category.create({
      id: randomUUID(),
      userId: input.ownerId,
      name: input.name,
      kind: input.kind,
    });

    const existing = await this.categoryRepository.findByNameAndKindForOwner(
      category.name,
      category.kind,
      input.ownerId,
    );
    if (existing) {
      throw new CategoryAlreadyExistsError();
    }

    const saved = await this.categoryRepository.save(category);

    return { id: saved.id, name: saved.name, kind: saved.kind };
  }
}
