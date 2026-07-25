import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
// NOTE: the use case and DTO classes below MUST stay as value imports (not
// `import type`), even though this file only uses them as parameter types.
// NestJS's constructor DI and ValidationPipe both rely on `emitDecoratorMetadata`
// capturing the real class reference at runtime; `import type` erases the
// import entirely, which breaks DI resolution and silently disables DTO
// validation (metatype degrades to `Object`).
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { GetDashboardSummaryUseCase } from '../../application/get-dashboard-summary.use-case';
import { GetIncomeExpenseTrendUseCase } from '../../application/get-income-expense-trend.use-case';
import { GetSpendByCategoryUseCase } from '../../application/get-spend-by-category.use-case';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { PeriodQueryDto } from './dto/period-query.dto';
/* eslint-enable @typescript-eslint/consistent-type-imports */
import type {
  DashboardSummaryResult,
  IncomeExpenseTrendEntry,
  SpendByCategoryEntry,
} from '../../application/ports/reporting.port';
import type { AuthenticatedUser } from '../../../auth/infrastructure/http/jwt.strategy';
import { JwtAuthGuard } from '../../../auth/infrastructure/http/jwt-auth.guard';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(
    private readonly getSpendByCategoryUseCase: GetSpendByCategoryUseCase,
    private readonly getIncomeExpenseTrendUseCase: GetIncomeExpenseTrendUseCase,
    private readonly getDashboardSummaryUseCase: GetDashboardSummaryUseCase,
  ) {}

  @Get('spend-by-category')
  async spendByCategory(
    @Req() req: AuthenticatedRequest,
    @Query() query: PeriodQueryDto,
  ): Promise<SpendByCategoryEntry[]> {
    return this.getSpendByCategoryUseCase.execute({
      ownerId: req.user.id,
      fromDate: new Date(query.fromDate),
      toDate: new Date(query.toDate),
    });
  }

  @Get('income-expense-trend')
  async incomeExpenseTrend(
    @Req() req: AuthenticatedRequest,
    @Query() query: PeriodQueryDto,
  ): Promise<IncomeExpenseTrendEntry[]> {
    return this.getIncomeExpenseTrendUseCase.execute({
      ownerId: req.user.id,
      fromDate: new Date(query.fromDate),
      toDate: new Date(query.toDate),
    });
  }

  @Get('summary')
  async summary(
    @Req() req: AuthenticatedRequest,
    @Query() query: DashboardSummaryQueryDto,
  ): Promise<DashboardSummaryResult> {
    return this.getDashboardSummaryUseCase.execute({
      ownerId: req.user.id,
      periodStart: query.fromDate ? new Date(query.fromDate) : undefined,
      periodEnd: query.toDate ? new Date(query.toDate) : undefined,
    });
  }
}
