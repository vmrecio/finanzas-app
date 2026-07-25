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
    return <p className="p-6 text-body-sm text-on-surface-variant">No budgets yet.</p>;
  }

  function categoryName(categoryId: string): string {
    return categories.find((category) => category.id === categoryId)?.name ?? categoryId;
  }

  return (
    <ul aria-label="Budgets" className="flex flex-col divide-y divide-surface-container">
      {budgets.map((budget) => {
        const progress = budget.limitCents > 0 ? Math.min(100, (budget.actualCents / budget.limitCents) * 100) : 0;
        return (
          <li key={budget.id} className="flex flex-col gap-3 px-6 py-4 hover:bg-surface-container-low">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body-md font-medium text-on-surface">
                  {categoryName(budget.categoryId)}
                </span>
                <span className="text-label-caps text-on-surface-variant">{budget.periodMonth}</span>
              </div>
              <span className="text-data-md text-on-surface">
                <MoneyDisplay amountCents={budget.actualCents} /> <span> / </span>
                <MoneyDisplay amountCents={budget.limitCents} />
              </span>
              <span
                className={`rounded-sm px-2 py-0.5 text-label-caps ${
                  budget.exceeded
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                    : 'bg-secondary-container text-on-secondary-container'
                }`}
              >
                {budget.exceeded ? 'Exceeded' : 'Under budget'}
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => onEdit(budget)}>
                  Edit
                </Button>
                <Button type="button" variant="danger" onClick={() => onDelete(budget.id)}>
                  Delete
                </Button>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
              <div
                className={`h-full rounded-full ${budget.exceeded ? 'bg-tertiary' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
