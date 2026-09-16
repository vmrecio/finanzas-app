'use client';

import { useState, type FormEvent } from 'react';
import type { AccountType } from '../../lib/api-client';
import { Button } from '../atoms/Button';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { INPUT_CLASSES } from '../atoms/Input';
import { FormField } from '../molecules/FormField';

export const ACCOUNT_TYPES: AccountType[] = ['bank', 'cash', 'credit_card'];

export interface AccountFormValues {
  name: string;
  type: AccountType;
}

export interface AccountFormProps {
  initialValues?: AccountFormValues;
  onSubmit: (values: AccountFormValues) => void;
  onCancel?: () => void;
  pending: boolean;
  error: string | null;
}

/** Pure presentational create/edit form for an account. */
export function AccountForm({ initialValues, onSubmit, onCancel, pending, error }: AccountFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [type, setType] = useState<AccountType>(initialValues?.type ?? 'bank');
  const isEditing = Boolean(initialValues);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit({ name, type });
  }

  return (
    <form
      aria-label={isEditing ? 'Edit account' : 'Create account'}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <FormField label="Name" name="account-name" value={name} onChange={setName} required />
        </div>
        <div className="flex-1">
          <label className="flex flex-col gap-1.5">
            <span className="text-body-sm font-bold text-on-surface">Type</span>
            <select
              name="account-type"
              value={type}
              onChange={(event) => setType(event.target.value as AccountType)}
              className={INPUT_CLASSES}
            >
              {ACCOUNT_TYPES.map((accountType) => (
                <option key={accountType} value={accountType}>
                  {accountType}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {error && <ErrorMessage message={error} />}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {isEditing ? 'Save' : 'Create'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
