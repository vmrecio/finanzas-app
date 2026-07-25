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
    return <p>No accounts yet.</p>;
  }

  return (
    <ul aria-label="Accounts">
      {accounts.map((account) => (
        <li key={account.id}>
          <span>{account.name}</span>
          <span>{account.type}</span>
          <MoneyDisplay amountCents={account.balanceCents} />
          <Button type="button" onClick={() => onEdit(account)}>
            Edit
          </Button>
          <Button type="button" onClick={() => onDelete(account.id)}>
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
