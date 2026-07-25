import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Matches } from 'class-validator';

const PERIOD_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Matches(PERIOD_MONTH_PATTERN, { message: 'periodMonth must be in YYYY-MM format' })
  periodMonth?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  limitCents?: number;
}
