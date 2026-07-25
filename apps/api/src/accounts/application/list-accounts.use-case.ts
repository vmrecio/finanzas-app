import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNT_BALANCE, type AccountBalancePort } from './ports/account-balance.port';
import { ACCOUNT_REPOSITORY, type AccountRepositoryPort } from './ports/account-repository.port';
import type { AccountResult } from './create-account.use-case';

export interface ListAccountsInput {
  ownerId: string;
}

@Injectable()
export class ListAccountsUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepositoryPort,
    @Inject(ACCOUNT_BALANCE) private readonly accountBalance: AccountBalancePort,
  ) {}

  async execute(input: ListAccountsInput): Promise<AccountResult[]> {
    const accounts = await this.accountRepository.listForOwner(input.ownerId);

    return Promise.all(
      accounts.map(async (account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        createdAt: account.createdAt,
        balanceCents: await this.accountBalance.getBalanceForOwner(account.id, input.ownerId),
      })),
    );
  }
}
