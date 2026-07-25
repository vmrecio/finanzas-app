import type { AccountDto, CategoryDto, TransactionDto } from '../../lib/api-client';
import { Button } from '../atoms/Button';
import { MoneyDisplay } from '../atoms/MoneyDisplay';

export interface TransactionListProps {
  transactions: TransactionDto[];
  accounts: AccountDto[];
  categories: CategoryDto[];
  onEdit: (transaction: TransactionDto) => void;
  onDelete: (id: string) => void;
}

/** Pure presentational transaction list; resolves account/category names for display. */
export function TransactionList({
  transactions,
  accounts,
  categories,
  onEdit,
  onDelete,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return <p>No transactions yet.</p>;
  }

  function accountName(accountId: string): string {
    return accounts.find((account) => account.id === accountId)?.name ?? accountId;
  }

  function categoryName(categoryId: string): string {
    return categories.find((category) => category.id === categoryId)?.name ?? categoryId;
  }

  return (
    <ul aria-label="Transactions">
      {transactions.map((transaction) => (
        <li key={transaction.id}>
          <span>{transaction.occurredOn.slice(0, 10)}</span>
          <span>{accountName(transaction.accountId)}</span>
          <span>{categoryName(transaction.categoryId)}</span>
          <span>{transaction.type}</span>
          <MoneyDisplay amountCents={transaction.amountCents} />
          {transaction.note && <span>{transaction.note}</span>}
          <Button type="button" onClick={() => onEdit(transaction)}>
            Edit
          </Button>
          <Button type="button" onClick={() => onDelete(transaction.id)}>
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
