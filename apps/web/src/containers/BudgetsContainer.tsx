'use client';

import { useCallback, useEffect, useState } from 'react';
import { ErrorMessage } from '../components/atoms/ErrorMessage';
import type { BudgetFormInitialValues, BudgetFormValues } from '../components/organisms/BudgetForm';
import { BudgetForm } from '../components/organisms/BudgetForm';
import { BudgetList } from '../components/organisms/BudgetList';
import {
  ApiError,
  createBudget,
  deleteBudget,
  listBudgets,
  listCategories,
  updateBudget,
  type BudgetDto,
  type CategoryDto,
} from '../lib/api-client';

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function toInitialValues(budget: BudgetDto): BudgetFormInitialValues {
  return {
    categoryId: budget.categoryId,
    periodMonth: budget.periodMonth,
    limitEuros: (budget.limitCents / 100).toString(),
  };
}

/** Owns fetching/mutation for the budgets CRUD screen (plus its category refs). */
export function BudgetsContainer() {
  const [budgets, setBudgets] = useState<BudgetDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BudgetDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriesResult, budgetsResult] = await Promise.all([listCategories(), listBudgets()]);
      setCategories(categoriesResult);
      setBudgets(budgetsResult);
      setListError(null);
    } catch (err) {
      setListError(toMessage(err, 'Failed to load budgets.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listCategories(), listBudgets()])
      .then(([categoriesResult, budgetsResult]) => {
        if (!cancelled) {
          setCategories(categoriesResult);
          setBudgets(budgetsResult);
          setListError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setListError(toMessage(err, 'Failed to load budgets.'));
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

  async function handleSubmit(values: BudgetFormValues): Promise<void> {
    setFormError(null);
    setPending(true);
    try {
      if (editing) {
        await updateBudget(editing.id, values);
      } else {
        await createBudget(values);
      }
      setEditing(null);
      await refresh();
    } catch (err) {
      setFormError(toMessage(err, 'Failed to save budget.'));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setListError(null);
    try {
      await deleteBudget(id);
      await refresh();
    } catch (err) {
      setListError(toMessage(err, 'Failed to delete budget.'));
    }
  }

  return (
    <section>
      {listError && <ErrorMessage message={listError} />}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {/* Gated behind `loading` like TransactionForm — the category
              `<select>` defaults from the first expense category only once,
              at first render, so it must not mount before categories exist. */}
          <BudgetForm
            key={editing?.id ?? 'create'}
            categories={categories}
            initialValues={editing ? toInitialValues(editing) : undefined}
            onSubmit={handleSubmit}
            onCancel={editing ? () => setEditing(null) : undefined}
            pending={pending}
            error={formError}
          />
          <BudgetList
            budgets={budgets}
            categories={categories}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        </>
      )}
    </section>
  );
}
