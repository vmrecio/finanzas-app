'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '../atoms/Button';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { FormField } from '../molecules/FormField';

export interface RegisterFormProps {
  onSubmit: (email: string, password: string) => void;
  error: string | null;
  pending: boolean;
}

const MIN_PASSWORD_LENGTH = 8;

/** Pure presentational register form. Owns only local controlled-input state. */
export function RegisterForm({ onSubmit, error, pending }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!email || !password) {
      setValidationError('Email and password are required.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setValidationError(null);
    onSubmit(email, password);
  }

  const displayedError = validationError ?? error;

  return (
    <form aria-label="Register" onSubmit={handleSubmit}>
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
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
