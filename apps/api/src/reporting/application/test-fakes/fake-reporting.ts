import type {
  DashboardSummaryResult,
  IncomeExpenseTrendEntry,
  ReportingPort,
  SpendByCategoryEntry,
} from '../ports/reporting.port';

/**
 * Configurable fake so use-case tests can assert exactly which arguments
 * reached the port (owner-scoping, period bounds) without a real Postgres
 * connection.
 */
export class FakeReporting implements ReportingPort {
  spendByCategoryResult: SpendByCategoryEntry[] = [];
  incomeExpenseTrendResult: IncomeExpenseTrendEntry[] = [];
  dashboardSummaryResult: DashboardSummaryResult = {
    totalBalanceCents: 0,
    periodIncomeCents: 0,
    periodExpenseCents: 0,
  };

  lastSpendByCategoryCall?: { ownerId: string; fromDate: Date; toDate: Date };
  lastIncomeExpenseTrendCall?: { ownerId: string; fromDate: Date; toDate: Date };
  lastDashboardSummaryCall?: { ownerId: string; periodStart: Date; periodEnd: Date };

  async getSpendByCategory(
    ownerId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<SpendByCategoryEntry[]> {
    this.lastSpendByCategoryCall = { ownerId, fromDate, toDate };
    return this.spendByCategoryResult;
  }

  async getIncomeExpenseTrend(
    ownerId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<IncomeExpenseTrendEntry[]> {
    this.lastIncomeExpenseTrendCall = { ownerId, fromDate, toDate };
    return this.incomeExpenseTrendResult;
  }

  async getDashboardSummary(
    ownerId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<DashboardSummaryResult> {
    this.lastDashboardSummaryCall = { ownerId, periodStart, periodEnd };
    return this.dashboardSummaryResult;
  }
}
