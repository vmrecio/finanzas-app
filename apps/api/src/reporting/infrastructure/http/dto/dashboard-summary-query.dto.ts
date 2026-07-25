import { IsISO8601, IsOptional } from 'class-validator';

/** Optional period for the dashboard summary — defaults to the current calendar month. */
export class DashboardSummaryQueryDto {
  @IsOptional()
  @IsISO8601()
  fromDate?: string;

  @IsOptional()
  @IsISO8601()
  toDate?: string;
}
