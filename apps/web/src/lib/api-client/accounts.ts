import { request } from './http';
import type { AccountDto, CreateAccountInput, UpdateAccountInput } from './types';

export async function listAccounts(): Promise<AccountDto[]> {
  return request<AccountDto[]>('/accounts');
}

export async function getAccount(id: string): Promise<AccountDto> {
  return request<AccountDto>(`/accounts/${id}`);
}

export async function createAccount(input: CreateAccountInput): Promise<AccountDto> {
  return request<AccountDto>('/accounts', { method: 'POST', body: input });
}

export async function updateAccount(id: string, input: UpdateAccountInput): Promise<AccountDto> {
  return request<AccountDto>(`/accounts/${id}`, { method: 'PATCH', body: input });
}

export async function deleteAccount(id: string): Promise<void> {
  return request<void>(`/accounts/${id}`, { method: 'DELETE' });
}
