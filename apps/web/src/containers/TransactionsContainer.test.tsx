import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api-client/api-error';
import { TransactionsContainer } from './TransactionsContainer';

const { listAccountsMock, listCategoriesMock, listTransactionsMock, createMock, deleteMock } =
  vi.hoisted(() => ({
    listAccountsMock: vi.fn(),
    listCategoriesMock: vi.fn(),
    listTransactionsMock: vi.fn(),
    createMock: vi.fn(),
    deleteMock: vi.fn(),
  }));

vi.mock('../lib/api-client', () => ({
  listAccounts: listAccountsMock,
  listCategories: listCategoriesMock,
  listTransactions: listTransactionsMock,
  createTransaction: createMock,
  updateTransaction: vi.fn(),
  deleteTransaction: deleteMock,
  ApiError,
}));

const accounts = [
  { id: 'acc-1', name: 'Main Checking', type: 'bank' as const, createdAt: '2026-01-01', balanceCents: 0 },
];
const categories = [{ id: 'cat-1', name: 'Groceries', kind: 'expense' as const }];
const initialTransactions = [
  {
    id: 'txn-1',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    type: 'expense' as const,
    amountCents: 2500,
    occurredOn: '2026-07-01T00:00:00.000Z',
    note: null,
  },
];

function transactionsList() {
  return screen.getByLabelText('Transactions');
}

describe('TransactionsContainer', () => {
  beforeEach(() => {
    listAccountsMock.mockReset();
    listCategoriesMock.mockReset();
    listTransactionsMock.mockReset();
    createMock.mockReset();
    deleteMock.mockReset();
    listAccountsMock.mockResolvedValue(accounts);
    listCategoriesMock.mockResolvedValue(categories);
    listTransactionsMock.mockResolvedValue(initialTransactions);
  });

  it('lists existing transactions with resolved account/category names', async () => {
    render(<TransactionsContainer />);

    await screen.findByLabelText('Transactions');
    const list = within(transactionsList());
    expect(list.getByText('Main Checking')).toBeInTheDocument();
    expect(list.getByText('Groceries')).toBeInTheDocument();
    expect(list.getByText('25,00 €')).toBeInTheDocument();
  });

  it('creates a new transaction and refreshes the list', async () => {
    const user = userEvent.setup();
    createMock.mockResolvedValueOnce({
      id: 'txn-2',
      accountId: 'acc-1',
      categoryId: 'cat-1',
      type: 'expense',
      amountCents: 1000,
      occurredOn: '2026-07-02T00:00:00.000Z',
      note: null,
    });
    listTransactionsMock
      .mockResolvedValueOnce(initialTransactions)
      .mockResolvedValueOnce([
        ...initialTransactions,
        {
          id: 'txn-2',
          accountId: 'acc-1',
          categoryId: 'cat-1',
          type: 'expense',
          amountCents: 1000,
          occurredOn: '2026-07-02T00:00:00.000Z',
          note: null,
        },
      ]);

    render(<TransactionsContainer />);
    await screen.findByLabelText('Transactions');

    await user.type(screen.getByLabelText('Amount (EUR)'), '10');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith({
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amountCents: 1000,
        occurredOn: expect.any(String),
        note: undefined,
      }),
    );
    await waitFor(() => expect(within(transactionsList()).getByText('10,00 €')).toBeInTheDocument());
  });

  it('deletes a transaction', async () => {
    const user = userEvent.setup();
    deleteMock.mockResolvedValueOnce(undefined);
    listTransactionsMock.mockResolvedValueOnce(initialTransactions).mockResolvedValueOnce([]);

    render(<TransactionsContainer />);
    await screen.findByLabelText('Transactions');

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('txn-1'));
    expect(await screen.findByText('No transactions yet.')).toBeInTheDocument();
  });

  it('shows a validation error for a non-positive amount without calling the API', async () => {
    const user = userEvent.setup();
    render(<TransactionsContainer />);
    await screen.findByLabelText('Transactions');

    await user.type(screen.getByLabelText('Amount (EUR)'), '0');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/valid positive amount/i);
    expect(createMock).not.toHaveBeenCalled();
  });
});
