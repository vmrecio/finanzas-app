import { randomUUID } from 'node:crypto';
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
import { TransactionCategoryKindMismatchError } from '../domain/errors';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
} from './ports/transaction-repository.port';

export interface CreateTransactionInput {
  ownerId: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amountCents: number;
  occurredOn: Date;
  note?: string;
}

export interface TransactionResult {
  id: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amountCents: number;
  occurredOn: Date;
  note: string | null;
}

export function toTransactionResult(transaction: Transaction): TransactionResult {
  return {
    id: transaction.id,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
    type: transaction.type,
    amountCents: transaction.amount.amountCents,
    occurredOn: transaction.occurredOn,
    note: transaction.note,
  };
}

/**
 * Creating a transaction is the second IDOR surface in the system (see
 * design.md "Ownership scoping / data isolation"): beyond scoping the
 * transaction itself to its owner, the referenced `accountId`/`categoryId`
 * MUST also belong to that same owner before persistence. Both checks reuse
 * the referenced module's own `findByIdForOwner` + `*NotFoundError`, which
 * already collapse "missing" and "owned by someone else" into the same
 * not-found outcome — no new cross-owner leakage surface is introduced here.
 */
@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepositoryPort,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(input: CreateTransactionInput): Promise<TransactionResult> {
    const account = await this.accountRepository.findByIdForOwner(input.accountId, input.ownerId);
    if (!account) {
      throw new AccountNotFoundError();
    }

    const category = await this.categoryRepository.findByIdForOwner(input.categoryId, input.ownerId);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    if (category.kind !== input.type) {
      throw new TransactionCategoryKindMismatchError();
    }

    const transaction = Transaction.create({
      id: randomUUID(),
      userId: input.ownerId,
      accountId: input.accountId,
      categoryId: input.categoryId,
      type: input.type,
      amount: Money.fromCents(input.amountCents),
      occurredOn: input.occurredOn,
      note: input.note,
    });
    const saved = await this.transactionRepository.save(transaction);

    return toTransactionResult(saved);
  }
}
