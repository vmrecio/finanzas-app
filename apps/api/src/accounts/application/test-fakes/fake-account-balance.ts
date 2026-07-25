import type { AccountBalancePort } from '../ports/account-balance.port';

/**
 * Configurable fake so balance-reflecting-reads tests can force a specific
 * balance deterministically, without a real transactions table.
 */
export class FakeAccountBalance implements AccountBalancePort {
  private readonly balanceCentsByAccountId = new Map<string, number>();

  setBalance(accountId: string, balanceCents: number): void {
    this.balanceCentsByAccountId.set(accountId, balanceCents);
  }

  async getBalanceForOwner(accountId: string, _ownerId: string): Promise<number> {
    return this.balanceCentsByAccountId.get(accountId) ?? 0;
  }
}
