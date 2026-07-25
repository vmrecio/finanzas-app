import type { CategoryDto } from '../../lib/api-client';
import { Button } from '../atoms/Button';

export interface CategoryListProps {
  categories: CategoryDto[];
  onEdit: (category: CategoryDto) => void;
  onDelete: (id: string) => void;
}

/** Pure presentational category list. */
export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  if (categories.length === 0) {
    return <p className="p-6 text-body-sm text-on-surface-variant">No categories yet.</p>;
  }

  return (
    <ul aria-label="Categories" className="flex flex-col divide-y divide-surface-container">
      {categories.map((category) => (
        <li
          key={category.id}
          className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-6 py-3 hover:bg-surface-container-low"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="min-w-0 flex-1 truncate text-body-md font-medium text-on-surface">
              {category.name}
            </span>
            <span
              className={`text-label-caps ${category.kind === 'income' ? 'text-secondary' : 'text-on-surface-variant'}`}
            >
              {category.kind}
            </span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => onEdit(category)}>
              Edit
            </Button>
            <Button type="button" variant="danger" onClick={() => onDelete(category.id)}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
