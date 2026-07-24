import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ACCOUNT_TYPES, type AccountType } from '../../../domain/account.entity';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsIn(ACCOUNT_TYPES)
  type?: AccountType;
}
