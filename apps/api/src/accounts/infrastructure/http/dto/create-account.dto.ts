import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ACCOUNT_TYPES, type AccountType } from '../../../domain/account.entity';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(ACCOUNT_TYPES)
  type!: AccountType;
}
