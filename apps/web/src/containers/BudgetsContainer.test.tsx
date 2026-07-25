import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api-client/api-error';
import { BudgetsContainer } from './BudgetsContainer';

const { listBudgetsMock, listCategoriesMock, createMock, updateMock, deleteMock } = vi.hoisted(() => ({
  listBudgetsMock: vi.fn(),
  listCategoriesMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
  listBudgets: listBudgetsMock,
  listCategories: listCategoriesMock,
  createBudget: createMock,
  updateBudget: updateMock,
  deleteBudget: deleteMock,
  ApiError,
}));

const categories = [
  { id: 'cat-1', name: 'Groceries', kind: 'expense' as const },
  { id: 'cat-2', name: 'Salary', kind: 'income' as const },
];

const initialBudgets = [
  {
    id: 'budget-1',
    categoryId: 'cat-1',
    periodMonth: '2026-07',
    limitCents: 50000,
    actualCents: 30000,
    exceeded: false,
  },
];

describe('BudgetsContainer', () => {
  beforeEach(() => {
    listBudgetsMock.mockReset();
    listCategoriesMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    listCategoriesMock.mockResolvedValue(categories);
    listBudgetsMock.mockResolvedValue(initialBudgets);
  });

  it('lists existing budgets with resolved category name and under-budget status', async () => {
    render(<BudgetsContainer />);

    const list = await screen.findByLabelText('Budgets');
    expect(within(list).getByText('Groceries')).toBeInTheDocument();
    expect(within(list).getByText('Under budget')).toBeInTheDocument();
  });

  it('flags an exceeded budget', async () => {
    listBudgetsMock.mockResolvedValueOnce([
      { ...initialBudgets[0], actualCents: 60000, exceeded: true },
    ]);

    render(<BudgetsContainer />);

    expect(await screen.findByText('Exceeded')).toBeInTheDocument();
  });

  it('only offers expense categories in the create form', async () => {
    render(<BudgetsContainer />);
    await screen.findByLabelText('Budgets');

    const select = screen.getByLabelText('Category') as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((option) => option.textContent);
    expect(optionLabels).toEqual(['Groceries']);
  });

  it('creates a new budget and refreshes the list', async () => {
    const user = userEvent.setup();
    createMock.mockResolvedValueOnce({
      id: 'budget-2',
      categoryId: 'cat-1',
      periodMonth: '2026-08',
      limitCents: 20000,
      actualCents: 0,
      exceeded: false,
    });
    listBudgetsMock.mockResolvedValueOnce(initialBudgets).mockResolvedValueOnce([
      ...initialBudgets,
      {
        id: 'budget-2',
        categoryId: 'cat-1',
        periodMonth: '2026-08',
        limitCents: 20000,
        actualCents: 0,
        exceeded: false,
      },
    ]);

    render(<BudgetsContainer />);
    await screen.findByLabelText('Budgets');

    await user.type(screen.getByLabelText('Limit (EUR)'), '200');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith({
        categoryId: 'cat-1',
        periodMonth: expect.any(String),
        limitCents: 20000,
      }),
    );
    expect(await within(screen.getByLabelText('Budgets')).findAllByText('Groceries')).toHaveLength(2);
  });

  it('shows the API error message on a duplicate budget', async () => {
    const user = userEvent.setup();
    createMock.mockRejectedValueOnce(new ApiError(409, 'Budget already exists'));

    render(<BudgetsContainer />);
    await screen.findByLabelText('Budgets');

    await user.type(screen.getByLabelText('Limit (EUR)'), '200');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Budget already exists');
  });

  it('deletes a budget', async () => {
    const user = userEvent.setup();
    deleteMock.mockResolvedValueOnce(undefined);
    listBudgetsMock.mockResolvedValueOnce(initialBudgets).mockResolvedValueOnce([]);

    render(<BudgetsContainer />);
    await screen.findByLabelText('Budgets');

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('budget-1'));
    expect(await screen.findByText('No budgets yet.')).toBeInTheDocument();
  });
});
