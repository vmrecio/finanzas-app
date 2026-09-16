import { CategoriesContainer } from '../../../containers/CategoriesContainer';

export default function CategoriesPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 md:px-8">
      <h1 className="text-headline-lg text-on-surface">Categories</h1>
      <CategoriesContainer />
    </main>
  );
}
