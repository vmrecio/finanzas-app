'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RegisterForm } from '../components/organisms/RegisterForm';
import { ApiError, register } from '../lib/api-client';

/**
 * Owns register form state/submission. `POST /auth/register` issues no
 * tokens, so on success we redirect to `/login` for the user to sign in.
 */
export function RegisterContainer() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(email: string, password: string): Promise<void> {
    setError(null);
    setPending(true);
    try {
      await register({ email, password });
      router.push('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return <RegisterForm onSubmit={handleSubmit} error={error} pending={pending} />;
}
