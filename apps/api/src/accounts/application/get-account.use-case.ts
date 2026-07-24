import { Inject, Injectable } from '@nestjs/common';
import { AccountNotFoundError } from '../domain/errors';
import { ACCOUNT_REPOSITORY, type AccountRepositoryPort } from './ports/account-repository.port';
import type { AccountResult } from './create-account.use-case';

export interface GetAccountInput {
  id: string;
  ownerId: string;
}

@Injectable()
export class GetAccountUseCase {
  constructor(@Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepositoryPort) {}

  async execute(input: GetAccountInput): Promise<AccountResult> {
    const account = await this.accountRepository.findByIdForOwner(input.id, input.ownerId);

    if (!account) {
      throw new AccountNotFoundError();
    }

    return { id: account.id, name: account.name, type: account.type, createdAt: account.createdAt };
  }
}
