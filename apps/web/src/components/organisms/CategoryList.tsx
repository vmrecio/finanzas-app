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
    return <p>No categories yet.</p>;
  }

  return (
    <ul aria-label="Categories">
      {categories.map((category) => (
        <li key={category.id}>
          <span>{category.name}</span>
          <span>{category.kind}</span>
          <Button type="button" onClick={() => onEdit(category)}>
            Edit
          </Button>
          <Button type="button" onClick={() => onDelete(category.id)}>
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
