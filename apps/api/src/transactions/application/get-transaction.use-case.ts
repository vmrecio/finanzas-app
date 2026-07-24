import { Inject, Injectable } from '@nestjs/common';
import { TransactionNotFoundError } from '../domain/errors';
import { toTransactionResult, type TransactionResult } from './create-transaction.use-case';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
} from './ports/transaction-repository.port';

export interface GetTransactionInput {
  id: string;
  ownerId: string;
}

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(input: GetTransactionInput): Promise<TransactionResult> {
    const transaction = await this.transactionRepository.findByIdForOwner(input.id, input.ownerId);

    if (!transaction) {
      throw new TransactionNotFoundError();
    }

    return toTransactionResult(transaction);
  }
}
