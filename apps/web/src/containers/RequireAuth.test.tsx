import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api-client/api-error';
import { AuthProvider } from './auth-context';
import { RequireAuth } from './RequireAuth';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
}));

const { meMock } = vi.hoisted(() => ({ meMock: vi.fn() }));

vi.mock('../lib/api-client', () => ({
  me: meMock,
  clearAccessToken: vi.fn(),
  ApiError,
}));

describe('RequireAuth', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    meMock.mockReset();
  });

  it('redirects to /login when the session check fails', async () => {
    meMock.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'));

    render(
      <AuthProvider>
        <RequireAuth>
          <p>Protected content</p>
        </RequireAuth>
      </AuthProvider>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children once the session check succeeds', async () => {
    meMock.mockResolvedValueOnce({ id: 'user-1' });

    render(
      <AuthProvider>
        <RequireAuth>
          <p>Protected content</p>
        </RequireAuth>
      </AuthProvider>,
    );

    expect(await screen.findByText('Protected content')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
