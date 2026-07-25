import { IsInt, IsNotEmpty, IsPositive, IsString, Matches } from 'class-validator';

// See budgets/application/budget-period.ts — same 'YYYY-MM' shape validated
// at the DTO boundary before it ever reaches the domain entity.
const PERIOD_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @Matches(PERIOD_MONTH_PATTERN, { message: 'periodMonth must be in YYYY-MM format' })
  periodMonth!: string;

  @IsInt()
  @IsPositive()
  limitCents!: number;
}
