import type { DashboardSummaryResult } from '../../lib/api-client';
import { MoneyDisplay } from '../atoms/MoneyDisplay';

export interface SummaryStatsProps {
  summary: DashboardSummaryResult;
}

/** Pure presentational dashboard summary stats (total balance + current-period income/expense). */
export function SummaryStats({ summary }: SummaryStatsProps) {
  return (
    <dl aria-label="Summary">
      <div>
        <dt>Total balance</dt>
        <dd>
          <MoneyDisplay amountCents={summary.totalBalanceCents} />
        </dd>
      </div>
      <div>
        <dt>Income this period</dt>
        <dd>
          <MoneyDisplay amountCents={summary.periodIncomeCents} />
        </dd>
      </div>
      <div>
        <dt>Expense this period</dt>
        <dd>
          <MoneyDisplay amountCents={summary.periodExpenseCents} />
        </dd>
      </div>
    </dl>
  );
}
