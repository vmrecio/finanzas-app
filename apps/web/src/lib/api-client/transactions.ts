import { request } from './http';
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  TransactionDto,
  UpdateTransactionInput,
} from './types';

function toQueryString(query: ListTransactionsQuery): string {
  const params = new URLSearchParams();
  if (query.accountId) params.set('accountId', query.accountId);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.fromDate) params.set('fromDate', query.fromDate);
  if (query.toDate) params.set('toDate', query.toDate);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listTransactions(
  query: ListTransactionsQuery = {},
): Promise<TransactionDto[]> {
  return request<TransactionDto[]>(`/transactions${toQueryString(query)}`);
}

export async function getTransaction(id: string): Promise<TransactionDto> {
  return request<TransactionDto>(`/transactions/${id}`);
}

export async function createTransaction(input: CreateTransactionInput): Promise<TransactionDto> {
  return request<TransactionDto>('/transactions', { method: 'POST', body: input });
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<TransactionDto> {
  return request<TransactionDto>(`/transactions/${id}`, { method: 'PATCH', body: input });
}

export async function deleteTransaction(id: string): Promise<void> {
  return request<void>(`/transactions/${id}`, { method: 'DELETE' });
}
