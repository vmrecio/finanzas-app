export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Default period for the dashboard summary when no explicit range is given
 * (see spec.md "Dashboard Summary" — "current-period income/expense
 * totals"): the calendar month (UTC) containing `referenceDate`, from its
 * first instant to its last millisecond.
 */
export function getCurrentMonthRange(referenceDate: Date): DateRange {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0) - 1);

  return { start, end };
}
