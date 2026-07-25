import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { REPORTING } from './application/ports/reporting.port';
import { GetDashboardSummaryUseCase } from './application/get-dashboard-summary.use-case';
import { GetIncomeExpenseTrendUseCase } from './application/get-income-expense-trend.use-case';
import { GetSpendByCategoryUseCase } from './application/get-spend-by-category.use-case';
import { ReportingController } from './infrastructure/http/reporting.controller';
import { PrismaReportingAdapter } from './infrastructure/persistence/prisma-reporting.adapter';

@Module({
  // AuthModule provides JwtAuthGuard (used on ReportingController), same as
  // accounts/categories/transactions. Reporting is a pure read-only
  // aggregation concern (see design.md "Reporting / Aggregation"): it
  // queries Prisma directly, bypassing the Account/Category/Transaction
  // repositories, so it does not need to import those feature modules.
  imports: [AuthModule],
  controllers: [ReportingController],
  providers: [
    PrismaService,
    GetSpendByCategoryUseCase,
    GetIncomeExpenseTrendUseCase,
    GetDashboardSummaryUseCase,
    { provide: REPORTING, useClass: PrismaReportingAdapter },
  ],
})
export class ReportingModule {}
