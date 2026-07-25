import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api-client/api-error';
import { AccountsContainer } from './AccountsContainer';

const { listMock, createMock, updateMock, deleteMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
  listAccounts: listMock,
  createAccount: createMock,
  updateAccount: updateMock,
  deleteAccount: deleteMock,
  ApiError,
}));

const initialAccounts = [
  { id: 'acc-1', name: 'Main Checking', type: 'bank' as const, createdAt: '2026-01-01', balanceCents: 10000 },
];

describe('AccountsContainer', () => {
  beforeEach(() => {
    listMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    listMock.mockResolvedValue(initialAccounts);
  });

  it('lists existing accounts on mount', async () => {
    render(<AccountsContainer />);

    expect(await screen.findByText('Main Checking')).toBeInTheDocument();
    expect(screen.getByText('100,00 €')).toBeInTheDocument();
  });

  it('creates a new account and refreshes the list', async () => {
    const user = userEvent.setup();
    createMock.mockResolvedValueOnce({
      id: 'acc-2',
      name: 'Savings',
      type: 'bank',
      createdAt: '2026-01-02',
      balanceCents: 0,
    });
    listMock.mockResolvedValueOnce(initialAccounts).mockResolvedValueOnce([
      ...initialAccounts,
      { id: 'acc-2', name: 'Savings', type: 'bank' as const, createdAt: '2026-01-02', balanceCents: 0 },
    ]);

    render(<AccountsContainer />);
    await screen.findByText('Main Checking');

    await user.type(screen.getByLabelText('Name'), 'Savings');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createMock).toHaveBeenCalledWith({ name: 'Savings', type: 'bank' }));
    expect(await screen.findByText('Savings')).toBeInTheDocument();
  });

  it('edits an existing account', async () => {
    const user = userEvent.setup();
    updateMock.mockResolvedValueOnce({ ...initialAccounts[0], name: 'Renamed' });
    listMock
      .mockResolvedValueOnce(initialAccounts)
      .mockResolvedValueOnce([{ ...initialAccounts[0], name: 'Renamed' }]);

    render(<AccountsContainer />);
    await screen.findByText('Main Checking');

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith('acc-1', { name: 'Renamed', type: 'bank' }),
    );
    expect(await screen.findByText('Renamed')).toBeInTheDocument();
  });

  it('deletes an account', async () => {
    const user = userEvent.setup();
    deleteMock.mockResolvedValueOnce(undefined);
    listMock.mockResolvedValueOnce(initialAccounts).mockResolvedValueOnce([]);

    render(<AccountsContainer />);
    await screen.findByText('Main Checking');

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('acc-1'));
    expect(await screen.findByText('No accounts yet.')).toBeInTheDocument();
  });

  it('shows the API error message when deletion is blocked', async () => {
    const user = userEvent.setup();
    deleteMock.mockRejectedValueOnce(new ApiError(409, 'Account has existing transactions'));

    render(<AccountsContainer />);
    await screen.findByText('Main Checking');

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Account has existing transactions');
    expect(within(screen.getByLabelText('Accounts')).getByText('Main Checking')).toBeInTheDocument();
  });
});
