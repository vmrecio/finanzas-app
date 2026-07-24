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

    return { id: saved.id, name: saved.name, type: saved.type, createdAt: saved.createdAt };
  }
}
