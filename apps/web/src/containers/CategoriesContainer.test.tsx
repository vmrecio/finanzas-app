import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api-client/api-error';
import { CategoriesContainer } from './CategoriesContainer';

const { listMock, createMock, updateMock, deleteMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
  listCategories: listMock,
  createCategory: createMock,
  updateCategory: updateMock,
  deleteCategory: deleteMock,
  ApiError,
}));

const initialCategories = [{ id: 'cat-1', name: 'Groceries', kind: 'expense' as const }];

describe('CategoriesContainer', () => {
  beforeEach(() => {
    listMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    listMock.mockResolvedValue(initialCategories);
  });

  it('lists existing categories on mount', async () => {
    render(<CategoriesContainer />);

    expect(await screen.findByText('Groceries')).toBeInTheDocument();
  });

  it('creates a new category and refreshes the list', async () => {
    const user = userEvent.setup();
    createMock.mockResolvedValueOnce({ id: 'cat-2', name: 'Salary', kind: 'income' });
    listMock
      .mockResolvedValueOnce(initialCategories)
      .mockResolvedValueOnce([...initialCategories, { id: 'cat-2', name: 'Salary', kind: 'income' }]);

    render(<CategoriesContainer />);
    await screen.findByText('Groceries');

    await user.type(screen.getByLabelText('Name'), 'Salary');
    await user.selectOptions(screen.getByLabelText('Kind'), 'income');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createMock).toHaveBeenCalledWith({ name: 'Salary', kind: 'income' }));
    expect(await screen.findByText('Salary')).toBeInTheDocument();
  });

  it('shows the API error message on a duplicate name', async () => {
    const user = userEvent.setup();
    createMock.mockRejectedValueOnce(new ApiError(409, 'Category already exists'));

    render(<CategoriesContainer />);
    await screen.findByText('Groceries');

    await user.type(screen.getByLabelText('Name'), 'Groceries');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Category already exists');
  });

  it('deletes a category', async () => {
    const user = userEvent.setup();
    deleteMock.mockResolvedValueOnce(undefined);
    listMock.mockResolvedValueOnce(initialCategories).mockResolvedValueOnce([]);

    render(<CategoriesContainer />);
    await screen.findByText('Groceries');

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('cat-1'));
    expect(await screen.findByText('No categories yet.')).toBeInTheDocument();
  });
});
