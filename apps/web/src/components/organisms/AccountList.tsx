import type { AccountDto } from '../../lib/api-client';
import { Button } from '../atoms/Button';
import { MoneyDisplay } from '../atoms/MoneyDisplay';

export interface AccountListProps {
  accounts: AccountDto[];
  onEdit: (account: AccountDto) => void;
  onDelete: (id: string) => void;
}

/** Pure presentational account list. */
export function AccountList({ accounts, onEdit, onDelete }: AccountListProps) {
  if (accounts.length === 0) {
    return <p className="p-6 text-body-sm text-on-surface-variant">No accounts yet.</p>;
  }

  return (
    <ul aria-label="Accounts" className="flex flex-col divide-y divide-surface-container">
      {accounts.map((account) => (
        <li
          key={account.id}
          className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-6 py-3 hover:bg-surface-container-low"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="min-w-0 flex-1 truncate text-body-md font-medium text-on-surface">
              {account.name}
            </span>
            <span className="text-label-caps text-on-surface-variant">{account.type}</span>
          </div>
          <MoneyDisplay amountCents={account.balanceCents} className="text-data-md text-on-surface" />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => onEdit(account)}>
              Edit
            </Button>
            <Button type="button" variant="danger" onClick={() => onDelete(account.id)}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
