import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './auth-context';

const { meMock, logoutMock } = vi.hoisted(() => ({
  meMock: vi.fn(),
  logoutMock: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
  me: meMock,
  logout: logoutMock,
  clearAccessToken: vi.fn(),
}));

/** Minimal host exercising `useAuth()` so `signOut` can be triggered from a test. */
function SignOutHost() {
  const { status, signOut } = useAuth();
  return (
    <div>
      <span>status:{status}</span>
      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}

describe('AuthProvider signOut', () => {
  beforeEach(() => {
    meMock.mockReset();
    logoutMock.mockReset();
  });

  it('calls the api-client logout and clears the session', async () => {
    meMock.mockResolvedValueOnce({ id: 'user-1' });
    logoutMock.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignOutHost />
      </AuthProvider>,
    );
    await screen.findByText('status:authenticated');

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('status:unauthenticated')).toBeInTheDocument();
  });

  it('still clears local session state when the logout call rejects', async () => {
    meMock.mockResolvedValueOnce({ id: 'user-1' });
    logoutMock.mockRejectedValueOnce(new Error('network down'));
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignOutHost />
      </AuthProvider>,
    );
    await screen.findByText('status:authenticated');

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('status:unauthenticated')).toBeInTheDocument();
  });
});
