import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api-client/api-error';
import { AuthProvider } from './auth-context';
import { LoginContainer } from './LoginContainer';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

const { loginMock, meMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  meMock: vi.fn(),
}));

vi.mock('../lib/api-client', () => ({
  login: loginMock,
  me: meMock,
  clearAccessToken: vi.fn(),
  ApiError,
}));

function renderContainer() {
  return render(
    <AuthProvider>
      <LoginContainer />
    </AuthProvider>,
  );
}

describe('LoginContainer', () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
    meMock.mockReset();
    // AuthProvider's own mount-time `me()` call — unauthenticated by default.
    meMock.mockRejectedValue(new ApiError(401, 'Unauthorized'));
  });

  it('logs in successfully and redirects to /accounts', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce({ accessToken: 'token-123' });
    meMock.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'));
    meMock.mockResolvedValueOnce({ id: 'user-1' });

    renderContainer();

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/accounts'));
    expect(loginMock).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' });
  });

  it('shows a validation error without calling the API when fields are empty', async () => {
    const user = userEvent.setup();
    renderContainer();

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/required/i);
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('shows the API error message on invalid credentials', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValueOnce(new ApiError(401, 'Invalid credentials'));

    renderContainer();

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
