'use client';

import { useState, type FormEvent } from 'react';
import type { CategoryDto } from '../../lib/api-client';
import { Button } from '../atoms/Button';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { INPUT_CLASSES } from '../atoms/Input';
import { parseEurosToCents } from '../atoms/money';
import { FormField } from '../molecules/FormField';

export interface BudgetFormValues {
  categoryId: string;
  periodMonth: string;
  limitCents: number;
}

export interface BudgetFormInitialValues {
  categoryId: string;
  periodMonth: string;
  limitEuros: string;
}

export interface BudgetFormProps {
  categories: CategoryDto[];
  initialValues?: BudgetFormInitialValues;
  onSubmit: (values: BudgetFormValues) => void;
  onCancel?: () => void;
  pending: boolean;
  error: string | null;
}

/**
 * Pure presentational create/edit form for a budget. The category `<select>`
 * is filtered to `kind === 'expense'` as a UX nicety — the API is the real
 * enforcement (a budget on a non-expense category is rejected with 400).
 */
export function BudgetForm({
  categories,
  initialValues,
  onSubmit,
  onCancel,
  pending,
  error,
}: BudgetFormProps) {
  const expenseCategories = categories.filter((category) => category.kind === 'expense');
  const [categoryId, setCategoryId] = useState(
    initialValues?.categoryId ?? expenseCategories[0]?.id ?? '',
  );
  const [periodMonth, setPeriodMonth] = useState(
    initialValues?.periodMonth ?? new Date().toISOString().slice(0, 7),
  );
  const [limit, setLimit] = useState(initialValues?.limitEuros ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const isEditing = Boolean(initialValues);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const limitCents = parseEurosToCents(limit);
    if (limitCents === null || limitCents <= 0) {
      setValidationError('Enter a valid positive limit.');
      return;
    }
    if (!categoryId) {
      setValidationError('Select a category.');
      return;
    }
    setValidationError(null);
    onSubmit({ categoryId, periodMonth, limitCents });
  }

  const displayedError = validationError ?? error;

  return (
    <form
      aria-label={isEditing ? 'Edit budget' : 'Create budget'}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-body-sm font-bold text-on-surface">Category</span>
          <select
            name="budget-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={INPUT_CLASSES}
          >
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <FormField
          label="Month"
          name="budget-month"
          type="month"
          value={periodMonth}
          onChange={setPeriodMonth}
        />
        <FormField label="Limit (EUR)" name="budget-limit" value={limit} onChange={setLimit} />
      </div>
      {displayedError && <ErrorMessage message={displayedError} />}
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
