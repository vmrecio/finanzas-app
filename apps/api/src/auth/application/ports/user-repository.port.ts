import type { User } from '../../domain/user.entity';

/**
 * Owner-scoped repository port for User. There is no un-scoped listing
 * method here because User is the tenancy root, not an owned aggregate.
 */
export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
