import { Inject, Injectable, Optional } from '@nestjs/common';
import { REPORTING, type DashboardSummaryResult, type ReportingPort } from './ports/reporting.port';
import { getCurrentMonthRange } from './reporting-period';

export interface GetDashboardSummaryInput {
  ownerId: string;
  periodStart?: Date;
  periodEnd?: Date;
}

/**
 * Requirement: Dashboard Summary (spec.md) — total balance across all of the
 * owner's accounts (all-time, ledger-derived) plus the current-period
 * income/expense totals. When no explicit period is given, defaults to the
 * current calendar month (see design.md "Reporting / Aggregation").
 *
 * The optional `now` constructor param exists purely for deterministic unit
 * testing of the default-period branch; production wiring omits it and gets
 * the real clock.
 */
@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    @Inject(REPORTING) private readonly reporting: ReportingPort,
    @Optional() private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: GetDashboardSummaryInput): Promise<DashboardSummaryResult> {
    const { periodStart, periodEnd } = this.resolvePeriod(input);
    return this.reporting.getDashboardSummary(input.ownerId, periodStart, periodEnd);
  }

  private resolvePeriod(input: GetDashboardSummaryInput): { periodStart: Date; periodEnd: Date } {
    if (input.periodStart && input.periodEnd) {
      return { periodStart: input.periodStart, periodEnd: input.periodEnd };
    }

    const { start, end } = getCurrentMonthRange(this.now());
    return { periodStart: start, periodEnd: end };
  }
}
