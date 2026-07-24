import { Inject, Injectable } from '@nestjs/common';
import { AccountHasTransactionsError, AccountNotFoundError } from '../domain/errors';
import { ACCOUNT_REPOSITORY, type AccountRepositoryPort } from './ports/account-repository.port';
import {
  TRANSACTION_EXISTENCE,
  type TransactionExistencePort,
} from './ports/transaction-existence.port';

export interface DeleteAccountInput {
  id: string;
  ownerId: string;
}

@Injectable()
export class DeleteAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepositoryPort,
    @Inject(TRANSACTION_EXISTENCE) private readonly transactionExistence: TransactionExistencePort,
  ) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    const existing = await this.accountRepository.findByIdForOwner(input.id, input.ownerId);

    if (!existing) {
      throw new AccountNotFoundError();
    }

    const hasTransactions = await this.transactionExistence.existsForAccount(existing.id);
    if (hasTransactions) {
      throw new AccountHasTransactionsError();
    }

    await this.accountRepository.delete(existing.id);
  }
}
