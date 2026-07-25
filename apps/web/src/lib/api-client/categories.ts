import { request } from './http';
import type { CategoryDto, CreateCategoryInput, UpdateCategoryInput } from './types';

export async function listCategories(): Promise<CategoryDto[]> {
  return request<CategoryDto[]>('/categories');
}

export async function getCategory(id: string): Promise<CategoryDto> {
  return request<CategoryDto>(`/categories/${id}`);
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryDto> {
  return request<CategoryDto>('/categories', { method: 'POST', body: input });
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryDto> {
  return request<CategoryDto>(`/categories/${id}`, { method: 'PATCH', body: input });
}

export async function deleteCategory(id: string): Promise<void> {
  return request<void>(`/categories/${id}`, { method: 'DELETE' });
}
