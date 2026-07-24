import { Inject, Injectable } from '@nestjs/common';
import { Money } from '@finanzas/shared';
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from '../../accounts/application/ports/account-repository.port';
import { AccountNotFoundError } from '../../accounts/domain/errors';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from '../../categories/application/ports/category-repository.port';
import { CategoryNotFoundError } from '../../categories/domain/errors';
import { Transaction, type TransactionType } from '../domain/transaction.entity';
import { TransactionCategoryKindMismatchError, TransactionNotFoundError } from '../domain/errors';
import { toTransactionResult, type TransactionResult } from './create-transaction.use-case';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
} from './ports/transaction-repository.port';

export interface UpdateTransactionInput {
  id: string;
  ownerId: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  amountCents?: number;
  occurredOn?: Date;
  note?: string | null;
}

/**
 * Updating a transaction re-runs the same cross-owner IDOR checks as
 * creation whenever the referenced account/category or the type changes
 * (see `CreateTransactionUseCase` — otherwise a malicious update could
 * repoint an existing transaction to another owner's account/category
 * without ever going through creation's guards).
 */
@Injectable()
export class UpdateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepositoryPort,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(input: UpdateTransactionInput): Promise<TransactionResult> {
    const existing = await this.transactionRepository.findByIdForOwner(input.id, input.ownerId);
    if (!existing) {
      throw new TransactionNotFoundError();
    }

    const accountId = input.accountId ?? existing.accountId;
    const categoryId = input.categoryId ?? existing.categoryId;
    const type = input.type ?? existing.type;

    if (input.accountId !== undefined) {
      const account = await this.accountRepository.findByIdForOwner(accountId, input.ownerId);
      if (!account) {
        throw new AccountNotFoundError();
      }
    }

    if (input.categoryId !== undefined || input.type !== undefined) {
      const category = await this.categoryRepository.findByIdForOwner(categoryId, input.ownerId);
      if (!category) {
        throw new CategoryNotFoundError();
      }
      if (category.kind !== type) {
        throw new TransactionCategoryKindMismatchError();
      }
    }

    const updated = Transaction.create({
      id: existing.id,
      userId: existing.userId,
      accountId,
      categoryId,
      type,
      amount: input.amountCents !== undefined ? Money.fromCents(input.amountCents) : existing.amount,
      occurredOn: input.occurredOn ?? existing.occurredOn,
      note: input.note !== undefined ? input.note : existing.note,
    });
    const saved = await this.transactionRepository.save(updated);

    return toTransactionResult(saved);
  }
}
