'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '../atoms/Button';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { FormField } from '../molecules/FormField';

export interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  error: string | null;
  pending: boolean;
}

/** Pure presentational login form. Owns only local controlled-input state. */
export function LoginForm({ onSubmit, error, pending }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!email || !password) {
      setValidationError('Email and password are required.');
      return;
    }
    setValidationError(null);
    onSubmit(email, password);
  }

  const displayedError = validationError ?? error;

  return (
    <form aria-label="Login" onSubmit={handleSubmit}>
      <FormField label="Email" name="email" type="email" value={email} onChange={setEmail} />
      <FormField
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
      />
      {displayedError && <ErrorMessage message={displayedError} />}
      <Button type="submit" disabled={pending}>
        {pending ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  );
}
