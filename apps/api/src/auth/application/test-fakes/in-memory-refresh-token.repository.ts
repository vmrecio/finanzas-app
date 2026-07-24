import type {
  RefreshTokenRecord,
  RefreshTokenRepositoryPort,
} from '../ports/refresh-token-repository.port';

export class InMemoryRefreshTokenRepository implements RefreshTokenRepositoryPort {
  private readonly recordsById = new Map<string, RefreshTokenRecord>();

  async save(record: RefreshTokenRecord): Promise<RefreshTokenRecord> {
    this.recordsById.set(record.id, record);
    return record;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    for (const record of this.recordsById.values()) {
      if (record.tokenHash === tokenHash) {
        return record;
      }
    }
    return null;
  }

  async revoke(id: string): Promise<void> {
    const record = this.recordsById.get(id);
    if (record) {
      this.recordsById.set(id, { ...record, revokedAt: new Date() });
    }
  }

  async revokeFamily(familyId: string): Promise<void> {
    for (const record of this.recordsById.values()) {
      if (record.familyId === familyId && !record.revokedAt) {
        this.recordsById.set(record.id, { ...record, revokedAt: new Date() });
      }
    }
  }

  get size(): number {
    return this.recordsById.size;
  }

  async all(): Promise<RefreshTokenRecord[]> {
    return [...this.recordsById.values()];
  }
}
