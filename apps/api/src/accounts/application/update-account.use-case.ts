import { Inject, Injectable } from '@nestjs/common';
import { Account, type AccountType } from '../domain/account.entity';
import { AccountNotFoundError } from '../domain/errors';
import { ACCOUNT_REPOSITORY, type AccountRepositoryPort } from './ports/account-repository.port';
import type { AccountResult } from './create-account.use-case';

export interface UpdateAccountInput {
  id: string;
  ownerId: string;
  name?: string;
  type?: AccountType;
}

@Injectable()
export class UpdateAccountUseCase {
  constructor(@Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepositoryPort) {}

  async execute(input: UpdateAccountInput): Promise<AccountResult> {
    const existing = await this.accountRepository.findByIdForOwner(input.id, input.ownerId);

    if (!existing) {
      throw new AccountNotFoundError();
    }

    const updated = Account.create({
      id: existing.id,
      userId: existing.userId,
      name: input.name ?? existing.name,
      type: input.type ?? existing.type,
      createdAt: existing.createdAt,
    });
    const saved = await this.accountRepository.save(updated);

    return { id: saved.id, name: saved.name, type: saved.type, createdAt: saved.createdAt };
  }
}
