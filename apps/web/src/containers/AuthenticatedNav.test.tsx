import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticatedNav } from './AuthenticatedNav';
import { AuthProvider } from './auth-context';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

const { meMock, logoutMock } = vi.hoisted(() => ({
  meMock: vi.fn(),
  logoutMock: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
  me: meMock,
  logout: logoutMock,
  clearAccessToken: vi.fn(),
}));

describe('AuthenticatedNav', () => {
  beforeEach(() => {
    pushMock.mockReset();
    meMock.mockReset();
    logoutMock.mockReset();
    meMock.mockResolvedValue({ id: 'user-1' });
    logoutMock.mockResolvedValue(undefined);
  });

  it('renders links to every authenticated screen', async () => {
    render(
      <AuthProvider>
        <AuthenticatedNav />
      </AuthProvider>,
    );

    expect(await screen.findByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveAttribute('href', '/accounts');
    expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute('href', '/categories');
    expect(screen.getByRole('link', { name: 'Transactions' })).toHaveAttribute(
      'href',
      '/transactions',
    );
    expect(screen.getByRole('link', { name: 'Budgets' })).toHaveAttribute('href', '/budgets');
  });

  it('signs out and redirects to /login on Log out', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthenticatedNav />
      </AuthProvider>,
    );
    await screen.findByRole('link', { name: 'Dashboard' });

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
  });
});
