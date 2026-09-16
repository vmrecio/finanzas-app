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
    return <p className="p-6 text-body-sm text-on-surface-variant">No transactions yet.</p>;
  }

  function accountName(accountId: string): string {
    return accounts.find((account) => account.id === accountId)?.name ?? accountId;
  }

  function categoryName(categoryId: string): string {
    return categories.find((category) => category.id === categoryId)?.name ?? categoryId;
  }

  return (
    <ul aria-label="Transactions" className="flex flex-col divide-y divide-surface-container">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === 'income';
        return (
          <li
            key={transaction.id}
            className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-6 py-3 hover:bg-surface-container-low"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-body-md font-medium text-on-surface">
                {categoryName(transaction.categoryId)}
              </span>
              <span className="flex flex-wrap gap-x-1.5 text-label-caps text-on-surface-variant">
                <span>{transaction.occurredOn.slice(0, 10)}</span>
                <span>{accountName(transaction.accountId)}</span>
                {transaction.note && <span>{transaction.note}</span>}
              </span>
            </div>
            <span className="text-label-caps text-on-surface-variant">{transaction.type}</span>
            <span className={`flex items-center gap-0.5 ${isIncome ? 'text-secondary' : 'text-on-surface'}`}>
              <span aria-hidden="true">{isIncome ? '+' : '−'}</span>
              <MoneyDisplay amountCents={transaction.amountCents} className="text-data-md" />
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => onEdit(transaction)}>
                Edit
              </Button>
              <Button type="button" variant="danger" onClick={() => onDelete(transaction.id)}>
                Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
