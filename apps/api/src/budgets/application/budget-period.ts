export interface DateRange {
  start: Date;
  end: Date;
}

const PERIOD_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Computes the UTC calendar-month date range `[start, end]` matched by a
 * budget's `periodMonth` (e.g. "2026-07"), the same UTC boundary convention
 * as reporting's `getCurrentMonthRange` (see
 * apps/api/src/reporting/application/reporting-period.ts) — see spec.md
 * "Actual-vs-Limit Calculation": expenses are matched by `occurredOn`
 * falling within the budget's month.
 */
export function getMonthRangeForPeriod(periodMonth: string): DateRange {
  if (!PERIOD_MONTH_PATTERN.test(periodMonth)) {
    throw new Error('periodMonth must be in YYYY-MM format');
  }

  const [yearStr, monthStr] = periodMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;

  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0) - 1);

  return { start, end };
}
