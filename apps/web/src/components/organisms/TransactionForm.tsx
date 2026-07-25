'use client';

import { useState, type FormEvent } from 'react';
import type { AccountDto, CategoryDto, TransactionType } from '../../lib/api-client';
import { Button } from '../atoms/Button';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { parseEurosToCents } from '../atoms/money';
import { FormField } from '../molecules/FormField';

export const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense'];

export interface TransactionFormValues {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amountCents: number;
  occurredOn: string;
  note?: string;
}

export interface TransactionFormInitialValues {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amountEuros: string;
  occurredOn: string;
  note: string;
}

export interface TransactionFormProps {
  accounts: AccountDto[];
  categories: CategoryDto[];
  initialValues?: TransactionFormInitialValues;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel?: () => void;
  pending: boolean;
  error: string | null;
}

/** Pure presentational create/edit form for a transaction. Amount is entered in euros. */
export function TransactionForm({
  accounts,
  categories,
  initialValues,
  onSubmit,
  onCancel,
  pending,
  error,
}: TransactionFormProps) {
  const [accountId, setAccountId] = useState(initialValues?.accountId ?? accounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? categories[0]?.id ?? '');
  const [type, setType] = useState<TransactionType>(initialValues?.type ?? 'expense');
  const [amount, setAmount] = useState(initialValues?.amountEuros ?? '');
  const [occurredOn, setOccurredOn] = useState(
    initialValues?.occurredOn ?? new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const isEditing = Boolean(initialValues);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const amountCents = parseEurosToCents(amount);
    if (amountCents === null || amountCents <= 0) {
      setValidationError('Enter a valid positive amount.');
      return;
    }
    if (!accountId || !categoryId) {
      setValidationError('Select an account and a category.');
      return;
    }
    setValidationError(null);
    onSubmit({
      accountId,
      categoryId,
      type,
      amountCents,
      occurredOn,
      note: note || undefined,
    });
  }

  const displayedError = validationError ?? error;

  return (
    <form aria-label={isEditing ? 'Edit transaction' : 'Create transaction'} onSubmit={handleSubmit}>
      <label>
        <span>Account</span>
        <select
          name="transaction-account"
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Category</span>
        <select
          name="transaction-category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Type</span>
        <select
          name="transaction-type"
          value={type}
          onChange={(event) => setType(event.target.value as TransactionType)}
        >
          {TRANSACTION_TYPES.map((transactionType) => (
            <option key={transactionType} value={transactionType}>
              {transactionType}
            </option>
          ))}
        </select>
      </label>
      <FormField label="Amount (EUR)" name="transaction-amount" value={amount} onChange={setAmount} />
      <FormField
        label="Date"
        name="transaction-date"
        type="date"
        value={occurredOn}
        onChange={setOccurredOn}
      />
      <FormField label="Note" name="transaction-note" value={note} onChange={setNote} />
      {displayedError && <ErrorMessage message={displayedError} />}
      <Button type="submit" disabled={pending}>
        {isEditing ? 'Save' : 'Create'}
      </Button>
      {onCancel && (
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </form>
  );
}
