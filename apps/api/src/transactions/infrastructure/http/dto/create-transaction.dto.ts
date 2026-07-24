import { IsIn, IsISO8601, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { TRANSACTION_TYPES, type TransactionType } from '../../../domain/transaction.entity';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsIn(TRANSACTION_TYPES)
  type!: TransactionType;

  @IsInt()
  @IsPositive()
  amountCents!: number;

  @IsISO8601()
  occurredOn!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
