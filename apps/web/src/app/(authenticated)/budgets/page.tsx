import { BudgetsContainer } from '../../../containers/BudgetsContainer';

export default function BudgetsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 md:px-8">
      <h1 className="text-headline-lg text-on-surface">Budgets</h1>
      <BudgetsContainer />
    </main>
  );
}
