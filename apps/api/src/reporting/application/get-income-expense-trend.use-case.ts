import { Inject, Injectable } from '@nestjs/common';
import { REPORTING, type IncomeExpenseTrendEntry, type ReportingPort } from './ports/reporting.port';

export interface GetIncomeExpenseTrendInput {
  ownerId: string;
  fromDate: Date;
  toDate: Date;
}

/**
 * Requirement: Income-vs-Expense Trend (spec.md) — aggregated income and
 * expense totals per calendar month over the given range, owner-scoped, in
 * chronological order, suitable for charting.
 */
@Injectable()
export class GetIncomeExpenseTrendUseCase {
  constructor(@Inject(REPORTING) private readonly reporting: ReportingPort) {}

  async execute(input: GetIncomeExpenseTrendInput): Promise<IncomeExpenseTrendEntry[]> {
    return this.reporting.getIncomeExpenseTrend(input.ownerId, input.fromDate, input.toDate);
  }
}
