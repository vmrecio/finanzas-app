import { request } from './http';
import type {
  DashboardSummaryQuery,
  DashboardSummaryResult,
  IncomeExpenseTrendEntry,
  ReportPeriodQuery,
  SpendByCategoryEntry,
} from './types';

function periodQueryString(query: ReportPeriodQuery): string {
  const params = new URLSearchParams();
  params.set('fromDate', query.fromDate);
  params.set('toDate', query.toDate);
  return `?${params.toString()}`;
}

function summaryQueryString(query: DashboardSummaryQuery): string {
  const params = new URLSearchParams();
  if (query.fromDate) params.set('fromDate', query.fromDate);
  if (query.toDate) params.set('toDate', query.toDate);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getSpendByCategory(query: ReportPeriodQuery): Promise<SpendByCategoryEntry[]> {
  return request<SpendByCategoryEntry[]>(`/reports/spend-by-category${periodQueryString(query)}`);
}

export async function getIncomeExpenseTrend(
  query: ReportPeriodQuery,
): Promise<IncomeExpenseTrendEntry[]> {
  return request<IncomeExpenseTrendEntry[]>(`/reports/income-expense-trend${periodQueryString(query)}`);
}

/** `fromDate`/`toDate` are optional — the API defaults to the current calendar month when omitted. */
export async function getDashboardSummary(
  query: DashboardSummaryQuery = {},
): Promise<DashboardSummaryResult> {
  return request<DashboardSummaryResult>(`/reports/summary${summaryQueryString(query)}`);
}
