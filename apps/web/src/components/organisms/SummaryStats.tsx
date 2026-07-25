import type { DashboardSummaryResult } from '../../lib/api-client';
import { Card } from '../atoms/Card';
import { MoneyDisplay } from '../atoms/MoneyDisplay';

export interface SummaryStatsProps {
  summary: DashboardSummaryResult;
}

interface StatCardProps {
  label: string;
  icon: string;
  amountCents: number;
  amountClassName?: string;
}

function StatCard({ label, icon, amountCents, amountClassName = 'text-on-surface' }: StatCardProps) {
  return (
    <Card className="flex flex-col justify-between gap-4 p-6">
      <div className="flex items-start justify-between">
        <span className="text-label-caps text-on-surface-variant">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {icon}
          </span>
        </div>
      </div>
      <div className={`text-data-lg ${amountClassName}`}>
        <MoneyDisplay amountCents={amountCents} />
      </div>
    </Card>
  );
}

/** Pure presentational dashboard summary stats (total balance + current-period income/expense). */
export function SummaryStats({ summary }: SummaryStatsProps) {
  return (
    <dl aria-label="Summary" className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div>
        <dt className="sr-only">Total balance</dt>
        <dd>
          <StatCard
            label="Total balance"
            icon="account_balance_wallet"
            amountCents={summary.totalBalanceCents}
          />
        </dd>
      </div>
      <div>
        <dt className="sr-only">Income this period</dt>
        <dd>
          <StatCard
            label="Income this period"
            icon="arrow_downward"
            amountCents={summary.periodIncomeCents}
            amountClassName="text-secondary"
          />
        </dd>
      </div>
      <div>
        <dt className="sr-only">Expense this period</dt>
        <dd>
          <StatCard
            label="Expense this period"
            icon="arrow_upward"
            amountCents={summary.periodExpenseCents}
          />
        </dd>
      </div>
    </dl>
  );
}
