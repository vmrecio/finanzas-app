import {
  IsIn,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TRANSACTION_TYPES, type TransactionType } from '../../../domain/transaction.entity';

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @IsOptional()
  @IsInt()
  @IsPositive()
  amountCents?: number;

  @IsOptional()
  @IsISO8601()
  occurredOn?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
