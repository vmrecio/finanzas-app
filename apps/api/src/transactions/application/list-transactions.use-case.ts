import { Inject, Injectable } from '@nestjs/common';
import { toTransactionResult, type TransactionResult } from './create-transaction.use-case';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
} from './ports/transaction-repository.port';

export interface ListTransactionsInput {
  ownerId: string;
  accountId?: string;
  categoryId?: string;
  fromDate?: Date;
  toDate?: Date;
}

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(input: ListTransactionsInput): Promise<TransactionResult[]> {
    const transactions = await this.transactionRepository.listForOwner(input.ownerId, {
      accountId: input.accountId,
      categoryId: input.categoryId,
      fromDate: input.fromDate,
      toDate: input.toDate,
    });

    return transactions.map(toTransactionResult);
  }
}
