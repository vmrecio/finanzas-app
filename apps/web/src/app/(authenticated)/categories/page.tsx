import { CategoriesContainer } from '../../containers/CategoriesContainer';
import { RequireAuth } from '../../containers/RequireAuth';

export default function CategoriesPage() {
  return (
    <RequireAuth>
      <main>
        <h1>Categories</h1>
        <CategoriesContainer />
      </main>
    </RequireAuth>
  );
}
