'use client';

import { useCallback, useEffect, useState } from 'react';
import { AccountForm, type AccountFormValues } from '../components/organisms/AccountForm';
import { AccountList } from '../components/organisms/AccountList';
import { ErrorMessage } from '../components/atoms/ErrorMessage';
import {
  ApiError,
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
  type AccountDto,
} from '../lib/api-client';

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** Owns fetching/mutation for the accounts CRUD screen. */
export function AccountsContainer() {
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AccountDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAccounts();
      setAccounts(result);
      setListError(null);
    } catch (err) {
      setListError(toMessage(err, 'Failed to load accounts.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    listAccounts()
      .then((result) => {
        if (!cancelled) {
          setAccounts(result);
          setListError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setListError(toMessage(err, 'Failed to load accounts.'));
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

  async function handleSubmit(values: AccountFormValues): Promise<void> {
    setFormError(null);
    setPending(true);
    try {
      if (editing) {
        await updateAccount(editing.id, values);
      } else {
        await createAccount(values);
      }
      setEditing(null);
      await refresh();
    } catch (err) {
      setFormError(toMessage(err, 'Failed to save account.'));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setListError(null);
    try {
      await deleteAccount(id);
      await refresh();
    } catch (err) {
      setListError(toMessage(err, 'Failed to delete account.'));
    }
  }

  return (
    <section>
      <AccountForm
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
        <AccountList accounts={accounts} onEdit={setEditing} onDelete={handleDelete} />
      )}
    </section>
  );
}
