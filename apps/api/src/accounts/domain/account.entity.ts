export const ACCOUNT_TYPES = ['bank', 'cash', 'credit_card'] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface CreateAccountProps {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  createdAt?: Date;
}

/**
 * Domain entity for a fund source (bank/cash/credit card). Framework-free:
 * knows nothing about Prisma or HTTP. Balance is intentionally NOT modeled
 * here — it is derived on read from the transaction ledger once the
 * Transactions capability (Phase 5) exists (see design.md "Domain Model").
 */
export class Account {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly type: AccountType,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateAccountProps): Account {
    const name = props.name.trim();

    if (name.length === 0) {
      throw new Error('Account name must not be empty');
    }

    if (!ACCOUNT_TYPES.includes(props.type)) {
      throw new Error(`Account type must be one of: ${ACCOUNT_TYPES.join(', ')}`);
    }

    return new Account(props.id, props.userId, name, props.type, props.createdAt ?? new Date());
  }
}
