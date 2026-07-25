'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoginForm } from '../components/organisms/LoginForm';
import { ApiError, login, me } from '../lib/api-client';
import { useAuth } from './auth-context';

/** Owns login form state/submission; delegates rendering to `LoginForm`. */
export function LoginContainer() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { setAuthenticated } = useAuth();

  async function handleSubmit(email: string, password: string): Promise<void> {
    setError(null);
    setPending(true);
    try {
      await login({ email, password });
      const session = await me();
      setAuthenticated(session.id);
      router.push('/accounts');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return <LoginForm onSubmit={handleSubmit} error={error} pending={pending} />;
}
