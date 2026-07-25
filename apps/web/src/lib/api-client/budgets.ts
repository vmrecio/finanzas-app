import { request } from './http';
import type { BudgetDto, CreateBudgetInput, UpdateBudgetInput } from './types';

export async function listBudgets(): Promise<BudgetDto[]> {
  return request<BudgetDto[]>('/budgets');
}

export async function getBudget(id: string): Promise<BudgetDto> {
  return request<BudgetDto>(`/budgets/${id}`);
}

export async function createBudget(input: CreateBudgetInput): Promise<BudgetDto> {
  return request<BudgetDto>('/budgets', { method: 'POST', body: input });
}

export async function updateBudget(id: string, input: UpdateBudgetInput): Promise<BudgetDto> {
  return request<BudgetDto>(`/budgets/${id}`, { method: 'PATCH', body: input });
}

export async function deleteBudget(id: string): Promise<void> {
  return request<void>(`/budgets/${id}`, { method: 'DELETE' });
}
