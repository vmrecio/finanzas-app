'use client';

import { useEffect, useState } from 'react';
import { ErrorMessage } from '../components/atoms/ErrorMessage';
import { IncomeExpenseTrendChart } from '../components/organisms/IncomeExpenseTrendChart';
import { SpendByCategoryChart } from '../components/organisms/SpendByCategoryChart';
import { SummaryStats } from '../components/organisms/SummaryStats';
import {
  ApiError,
  getDashboardSummary,
  getIncomeExpenseTrend,
  getSpendByCategory,
  type DashboardSummaryResult,
  type IncomeExpenseTrendEntry,
  type ReportPeriodQuery,
  type SpendByCategoryEntry,
} from '../lib/api-client';

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * Date range chosen for the two mandatory-range reports (spend-by-category,
 * income/expense trend): the last 6 calendar months including the current
 * one. This is a deliberate, consistent choice for both charts — it gives
 * the trend chart enough history to actually show a trend, and keeps the
 * spend-by-category aggregate meaningful even early in the current month
 * (rather than near-empty on the 1st/2nd). The dashboard summary
 * intentionally omits `fromDate`/`toDate` so the API applies its own default
 * (current calendar month) per the Reporting spec.
 */
export function lastSixMonthsRange(now: Date = new Date()): ReportPeriodQuery {
  const toDate = now.toISOString().slice(0, 10);
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const fromDate = from.toISOString().slice(0, 10);
  return { fromDate, toDate };
}

/** Owns fetching for the dashboard screen: summary, spend-by-category, income/expense trend. */
export function DashboardContainer() {
  const [summary, setSummary] = useState<DashboardSummaryResult | null>(null);
  const [spendByCategory, setSpendByCategory] = useState<SpendByCategoryEntry[]>([]);
  const [trend, setTrend] = useState<IncomeExpenseTrendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const range = lastSixMonthsRange();

    Promise.all([getDashboardSummary(), getSpendByCategory(range), getIncomeExpenseTrend(range)])
      .then(([summaryResult, spendResult, trendResult]) => {
        if (!cancelled) {
          setSummary(summaryResult);
          setSpendByCategory(spendResult);
          setTrend(trendResult);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(toMessage(err, 'Failed to load dashboard data.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p>Loading…</p>;
  }

  return (
    <section>
      {error && <ErrorMessage message={error} />}
      {summary && <SummaryStats summary={summary} />}
      <SpendByCategoryChart data={spendByCategory} />
      <IncomeExpenseTrendChart data={trend} />
    </section>
  );
}
