import { Inject, Injectable } from '@nestjs/common';
import { TransactionNotFoundError } from '../domain/errors';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
} from './ports/transaction-repository.port';

export interface DeleteTransactionInput {
  id: string;
  ownerId: string;
}

@Injectable()
export class DeleteTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(input: DeleteTransactionInput): Promise<void> {
    const existing = await this.transactionRepository.findByIdForOwner(input.id, input.ownerId);

    if (!existing) {
      throw new TransactionNotFoundError();
    }

    await this.transactionRepository.delete(existing.id);
  }
}
