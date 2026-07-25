'use client';

import { useState, type FormEvent } from 'react';
import type { CategoryKind } from '../../lib/api-client';
import { Button } from '../atoms/Button';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { FormField } from '../molecules/FormField';

export const CATEGORY_KINDS: CategoryKind[] = ['income', 'expense'];

export interface CategoryFormValues {
  name: string;
  kind: CategoryKind;
}

export interface CategoryFormProps {
  initialValues?: CategoryFormValues;
  onSubmit: (values: CategoryFormValues) => void;
  onCancel?: () => void;
  pending: boolean;
  error: string | null;
}

/** Pure presentational create/edit form for a category. */
export function CategoryForm({ initialValues, onSubmit, onCancel, pending, error }: CategoryFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [kind, setKind] = useState<CategoryKind>(initialValues?.kind ?? 'expense');
  const isEditing = Boolean(initialValues);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit({ name, kind });
  }

  return (
    <form aria-label={isEditing ? 'Edit category' : 'Create category'} onSubmit={handleSubmit}>
      <FormField label="Name" name="category-name" value={name} onChange={setName} required />
      <label>
        <span>Kind</span>
        <select
          name="category-kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as CategoryKind)}
        >
          {CATEGORY_KINDS.map((categoryKind) => (
            <option key={categoryKind} value={categoryKind}>
              {categoryKind}
            </option>
          ))}
        </select>
      </label>
      {error && <ErrorMessage message={error} />}
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
