import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api-client/api-error';
import { RegisterContainer } from './RegisterContainer';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

const { registerMock } = vi.hoisted(() => ({ registerMock: vi.fn() }));

vi.mock('../lib/api-client', () => ({
  register: registerMock,
  ApiError,
}));

describe('RegisterContainer', () => {
  beforeEach(() => {
    pushMock.mockReset();
    registerMock.mockReset();
  });

  it('registers successfully and redirects to /login', async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValueOnce({ id: 'user-1', email: 'a@b.com' });

    render(<RegisterContainer />);

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
    expect(registerMock).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' });
  });

  it('shows a validation error without calling the API for a short password', async () => {
    const user = userEvent.setup();
    render(<RegisterContainer />);

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/at least/i);
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('shows the API error message on a duplicate email', async () => {
    const user = userEvent.setup();
    registerMock.mockRejectedValueOnce(new ApiError(409, 'Email already in use'));

    render(<RegisterContainer />);

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already in use');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
