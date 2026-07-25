import { IsISO8601 } from 'class-validator';

/** Mandatory period for reports that always require an explicit range. */
export class PeriodQueryDto {
  @IsISO8601()
  fromDate!: string;

  @IsISO8601()
  toDate!: string;
}
