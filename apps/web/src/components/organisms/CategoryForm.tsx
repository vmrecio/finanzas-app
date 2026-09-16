'use client';

import { useState, type FormEvent } from 'react';
import type { CategoryKind } from '../../lib/api-client';
import { Button } from '../atoms/Button';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { INPUT_CLASSES } from '../atoms/Input';
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
    <form
      aria-label={isEditing ? 'Edit category' : 'Create category'}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <FormField label="Name" name="category-name" value={name} onChange={setName} required />
        </div>
        <div className="flex-1">
          <label className="flex flex-col gap-1.5">
            <span className="text-body-sm font-bold text-on-surface">Kind</span>
            <select
              name="category-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as CategoryKind)}
              className={INPUT_CLASSES}
            >
              {CATEGORY_KINDS.map((categoryKind) => (
                <option key={categoryKind} value={categoryKind}>
                  {categoryKind}
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
