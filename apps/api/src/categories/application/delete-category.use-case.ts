import { Inject, Injectable } from '@nestjs/common';
import { CategoryHasTransactionsError, CategoryNotFoundError } from '../domain/errors';
import { CATEGORY_REPOSITORY, type CategoryRepositoryPort } from './ports/category-repository.port';
import {
  TRANSACTION_REFERENCE,
  type TransactionReferencePort,
} from './ports/transaction-reference.port';

export interface DeleteCategoryInput {
  id: string;
  ownerId: string;
}

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
    @Inject(TRANSACTION_REFERENCE) private readonly transactionReference: TransactionReferencePort,
  ) {}

  async execute(input: DeleteCategoryInput): Promise<void> {
    const existing = await this.categoryRepository.findByIdForOwner(input.id, input.ownerId);

    if (!existing) {
      throw new CategoryNotFoundError();
    }

    const isReferenced = await this.transactionReference.existsForCategory(existing.id);
    if (isReferenced) {
      throw new CategoryHasTransactionsError();
    }

    await this.categoryRepository.delete(existing.id);
  }
}
