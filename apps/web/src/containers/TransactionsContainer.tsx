'use client';

import { useCallback, useEffect, useState } from 'react';
import { ErrorMessage } from '../components/atoms/ErrorMessage';
import type {
  TransactionFormInitialValues,
  TransactionFormValues,
} from '../components/organisms/TransactionForm';
import { TransactionForm } from '../components/organisms/TransactionForm';
import { TransactionList } from '../components/organisms/TransactionList';
import {
  ApiError,
  createTransaction,
  deleteTransaction,
  listAccounts,
  listCategories,
  listTransactions,
  updateTransaction,
  type AccountDto,
  type CategoryDto,
  type TransactionDto,
} from '../lib/api-client';

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function toInitialValues(transaction: TransactionDto): TransactionFormInitialValues {
  return {
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
    type: transaction.type,
    amountEuros: (transaction.amountCents / 100).toString(),
    occurredOn: transaction.occurredOn.slice(0, 10),
    note: transaction.note ?? '',
  };
}

/** Owns fetching/mutation for the transactions CRUD screen (plus its account/category refs). */
export function TransactionsContainer() {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<TransactionDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsResult, categoriesResult, transactionsResult] = await Promise.all([
        listAccounts(),
        listCategories(),
        listTransactions(),
      ]);
      setAccounts(accountsResult);
      setCategories(categoriesResult);
      setTransactions(transactionsResult);
      setListError(null);
    } catch (err) {
      setListError(toMessage(err, 'Failed to load transactions.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listAccounts(), listCategories(), listTransactions()])
      .then(([accountsResult, categoriesResult, transactionsResult]) => {
        if (!cancelled) {
          setAccounts(accountsResult);
          setCategories(categoriesResult);
          setTransactions(transactionsResult);
          setListError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setListError(toMessage(err, 'Failed to load transactions.'));
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

  async function handleSubmit(values: TransactionFormValues): Promise<void> {
    setFormError(null);
    setPending(true);
    try {
      if (editing) {
        await updateTransaction(editing.id, values);
      } else {
        await createTransaction(values);
      }
      setEditing(null);
      await refresh();
    } catch (err) {
      setFormError(toMessage(err, 'Failed to save transaction.'));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setListError(null);
    try {
      await deleteTransaction(id);
      await refresh();
    } catch (err) {
      setListError(toMessage(err, 'Failed to delete transaction.'));
    }
  }

  return (
    <section>
      {listError && <ErrorMessage message={listError} />}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {/* Rendered only once accounts/categories have loaded — the form's
              account/category selects default from the first loaded option
              on mount, so it must not mount before that data exists. */}
          <TransactionForm
            key={editing?.id ?? 'create'}
            accounts={accounts}
            categories={categories}
            initialValues={editing ? toInitialValues(editing) : undefined}
            onSubmit={handleSubmit}
            onCancel={editing ? () => setEditing(null) : undefined}
            pending={pending}
            error={formError}
          />
          <TransactionList
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        </>
      )}
    </section>
  );
}

