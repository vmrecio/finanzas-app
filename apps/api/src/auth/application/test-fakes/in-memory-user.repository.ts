import type { User } from '../../domain/user.entity';
import type { UserRepositoryPort } from '../ports/user-repository.port';

/**
 * In-memory fake used to test application-layer use cases without a real
 * database (see design.md "Testing Strategy" — application ports are tested
 * against in-memory fakes, not Prisma).
 */
export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly usersById = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.usersById.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }

  async save(user: User): Promise<User> {
    this.usersById.set(user.id, user);
    return user;
  }

  get size(): number {
    return this.usersById.size;
  }
}
