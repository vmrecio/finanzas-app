import { DashboardContainer } from '../../../containers/DashboardContainer';

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 md:px-8">
      <h1 className="text-headline-lg text-on-surface">Dashboard</h1>
      <DashboardContainer />
    </main>
  );
}
