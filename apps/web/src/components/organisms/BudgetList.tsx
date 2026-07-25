import type { BudgetDto, CategoryDto } from '../../lib/api-client';
import { Button } from '../atoms/Button';
import { MoneyDisplay } from '../atoms/MoneyDisplay';

export interface BudgetListProps {
  budgets: BudgetDto[];
  categories: CategoryDto[];
  onEdit: (budget: BudgetDto) => void;
  onDelete: (id: string) => void;
}

/** Pure presentational budget list; resolves category names and flags exceeded budgets. */
export function BudgetList({ budgets, categories, onEdit, onDelete }: BudgetListProps) {
  if (budgets.length === 0) {
    return <p>No budgets yet.</p>;
  }

  function categoryName(categoryId: string): string {
    return categories.find((category) => category.id === categoryId)?.name ?? categoryId;
  }

  return (
    <ul aria-label="Budgets">
      {budgets.map((budget) => (
        <li key={budget.id}>
          <span>{categoryName(budget.categoryId)}</span>
          <span>{budget.periodMonth}</span>
          <MoneyDisplay amountCents={budget.actualCents} />
          <span> / </span>
          <MoneyDisplay amountCents={budget.limitCents} />
          <span>{budget.exceeded ? 'Exceeded' : 'Under budget'}</span>
          <Button type="button" onClick={() => onEdit(budget)}>
            Edit
          </Button>
          <Button type="button" onClick={() => onDelete(budget.id)}>
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
