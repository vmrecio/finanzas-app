import type { Account } from '../../domain/account.entity';
import type { AccountRepositoryPort } from '../ports/account-repository.port';

/**
 * In-memory fake used to test application-layer use cases without a real
 * database (see design.md "Testing Strategy"). Holds multi-owner data so
 * ownership isolation is provable in fast, DB-free tests.
 */
export class InMemoryAccountRepository implements AccountRepositoryPort {
  private readonly accountsById = new Map<string, Account>();

  async findByIdForOwner(id: string, ownerId: string): Promise<Account | null> {
    const account = this.accountsById.get(id);
    if (!account || account.userId !== ownerId) {
      return null;
    }
    return account;
  }

  async listForOwner(ownerId: string): Promise<Account[]> {
    return [...this.accountsById.values()].filter((account) => account.userId === ownerId);
  }

  async save(account: Account): Promise<Account> {
    this.accountsById.set(account.id, account);
    return account;
  }

  async delete(id: string): Promise<void> {
    this.accountsById.delete(id);
  }

  get size(): number {
    return this.accountsById.size;
  }
}
