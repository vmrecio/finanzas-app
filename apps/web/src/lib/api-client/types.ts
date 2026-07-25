export type AccountType = 'bank' | 'cash' | 'credit_card';
export type CategoryKind = 'income' | 'expense';
export type TransactionType = 'income' | 'expense';

export interface AccountDto {
  id: string;
  name: string;
  type: AccountType;
  createdAt: string;
  balanceCents: number;
}

export interface CategoryDto {
  id: string;
  name: string;
  kind: CategoryKind;
}

export interface TransactionDto {
  id: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amountCents: number;
  occurredOn: string;
  note: string | null;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
}

export interface CreateCategoryInput {
  name: string;
  kind: CategoryKind;
}

export interface UpdateCategoryInput {
  name?: string;
  kind?: CategoryKind;
}

export interface CreateTransactionInput {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amountCents: number;
  occurredOn: string;
  note?: string;
}

export interface UpdateTransactionInput {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  amountCents?: number;
  occurredOn?: string;
  note?: string;
}

export interface ListTransactionsQuery {
  accountId?: string;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterResult {
  id: string;
  email: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
}

export interface MeResult {
  id: string;
}
