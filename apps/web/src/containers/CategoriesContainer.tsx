'use client';

import { useCallback, useEffect, useState } from 'react';
import { ErrorMessage } from '../components/atoms/ErrorMessage';
import { CategoryForm, type CategoryFormValues } from '../components/organisms/CategoryForm';
import { CategoryList } from '../components/organisms/CategoryList';
import {
  ApiError,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type CategoryDto,
} from '../lib/api-client';

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** Owns fetching/mutation for the categories CRUD screen. */
export function CategoriesContainer() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listCategories();
      setCategories(result);
      setListError(null);
    } catch (err) {
      setListError(toMessage(err, 'Failed to load categories.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    listCategories()
      .then((result) => {
        if (!cancelled) {
          setCategories(result);
          setListError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setListError(toMessage(err, 'Failed to load categories.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(values: CategoryFormValues): Promise<void> {
    setFormError(null);
    setPending(true);
    try {
      if (editing) {
        await updateCategory(editing.id, values);
      } else {
        await createCategory(values);
      }
      setEditing(null);
      await refresh();
    } catch (err) {
      setFormError(toMessage(err, 'Failed to save category.'));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setListError(null);
    try {
      await deleteCategory(id);
      await refresh();
    } catch (err) {
      setListError(toMessage(err, 'Failed to delete category.'));
    }
  }

  return (
    <section>
      <CategoryForm
        key={editing?.id ?? 'create'}
        initialValues={editing ?? undefined}
        onSubmit={handleSubmit}
        onCancel={editing ? () => setEditing(null) : undefined}
        pending={pending}
        error={formError}
      />
      {listError && <ErrorMessage message={listError} />}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <CategoryList categories={categories} onEdit={setEditing} onDelete={handleDelete} />
      )}
    </section>
  );
}
