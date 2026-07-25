import { Inject, Injectable } from '@nestjs/common';
import { REPORTING, type ReportingPort, type SpendByCategoryEntry } from './ports/reporting.port';

export interface GetSpendByCategoryInput {
  ownerId: string;
  fromDate: Date;
  toDate: Date;
}

/**
 * Requirement: Spend-by-Category Aggregation (spec.md) — total expense
 * amounts grouped by category for the given period, owner-scoped. An empty
 * result is a valid answer, never an error (see "Report with no data").
 */
@Injectable()
export class GetSpendByCategoryUseCase {
  constructor(@Inject(REPORTING) private readonly reporting: ReportingPort) {}

  async execute(input: GetSpendByCategoryInput): Promise<SpendByCategoryEntry[]> {
    return this.reporting.getSpendByCategory(input.ownerId, input.fromDate, input.toDate);
  }
}
