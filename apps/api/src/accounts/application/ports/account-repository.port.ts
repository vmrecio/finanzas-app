import type { Account } from '../../domain/account.entity';

/**
 * Owner-scoped repository port for Account. There is no un-scoped
 * `findById` — every read/write that targets a specific account MUST go
 * through `findByIdForOwner` so cross-owner access is structurally
 * impossible to forget (see design.md "Ownership scoping / data isolation").
 */
export interface AccountRepositoryPort {
  findByIdForOwner(id: string, ownerId: string): Promise<Account | null>;
  listForOwner(ownerId: string): Promise<Account[]>;
  save(account: Account): Promise<Account>;
  delete(id: string): Promise<void>;
}

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
