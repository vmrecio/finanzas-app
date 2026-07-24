import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Account, type AccountType } from '../domain/account.entity';
import { ACCOUNT_REPOSITORY, type AccountRepositoryPort } from './ports/account-repository.port';

export interface CreateAccountInput {
  ownerId: string;
  name: string;
  type: AccountType;
}

export interface AccountResult {
  id: string;
  name: string;
  type: AccountType;
  createdAt: Date;
  balanceCents: number;
}

@Injectable()
export class CreateAccountUseCase {
  constructor(@Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepositoryPort) {}

  async execute(input: CreateAccountInput): Promise<AccountResult> {
    const account = Account.create({
      id: randomUUID(),
      userId: input.ownerId,
      name: input.name,
      type: input.type,
    });
    const saved = await this.accountRepository.save(account);

    // A brand-new account cannot yet have any transactions (its id did not
    // exist for a foreign key to reference), so the ledger-derived balance
    // is trivially zero (see spec.md "Create account" scenario) without
    // needing an AccountBalancePort round-trip.
    return { id: saved.id, name: saved.name, type: saved.type, createdAt: saved.createdAt, balanceCents: 0 };
  }
}
