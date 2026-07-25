import type { Money } from '@finanzas/shared';

export const TRANSACTION_TYPES = ['income', 'expense'] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export interface CreateTransactionProps {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: Money;
  occurredOn: Date;
  note?: string | null;
}

/**
 * Domain entity for a ledger entry (see design.md "Domain Model").
 * Framework-free: knows nothing about Prisma or HTTP. Reuses the shared
 * `Money` value object (packages/shared) rather than reimplementing amount
 * arithmetic. The cross-aggregate invariant "category.kind matches
 * transaction.type" is NOT enforced here — validating it requires loading
 * the referenced Category (I/O), which is an application-layer concern (see
 * `CreateTransactionUseCase`), mirroring how Category's own duplicate-name
 * check lives in the application layer rather than the domain entity.
 */
export class Transaction {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly accountId: string,
    public readonly categoryId: string,
    public readonly type: TransactionType,
    public readonly amount: Money,
    public readonly occurredOn: Date,
    public readonly note: string | null,
  ) {}

  static create(props: CreateTransactionProps): Transaction {
    if (!TRANSACTION_TYPES.includes(props.type)) {
      throw new Error(`Transaction type must be one of: ${TRANSACTION_TYPES.join(', ')}`);
    }

    if (props.amount.amountCents <= 0) {
      throw new Error('Transaction amount must be a positive number of cents');
    }

    const trimmedNote = props.note?.trim();

    return new Transaction(
      props.id,
      props.userId,
      props.accountId,
      props.categoryId,
      props.type,
      props.amount,
      props.occurredOn,
      trimmedNote && trimmedNote.length > 0 ? trimmedNote : null,
    );
  }
}
