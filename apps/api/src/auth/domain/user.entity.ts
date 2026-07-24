const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A hashed credential produced by argon2/bcrypt always contains a `$`-delimited
// algorithm marker (e.g. `$argon2id$...`). This is a cheap, framework-free guard
// against ever handing the User entity a raw/plaintext password by mistake.
const HASH_MARKER = '$';

export interface RegisterUserProps {
  id: string;
  email: string;
  passwordHash: string;
  createdAt?: Date;
}

/**
 * Domain entity for an authenticated account. Framework-free: knows nothing
 * about Prisma, HTTP, or argon2 — only the invariants that must always hold.
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
  ) {}

  static register(props: RegisterUserProps): User {
    const email = props.email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      throw new Error('User email must be a valid email address');
    }

    if (props.passwordHash.length === 0) {
      throw new Error('User passwordHash must not be empty');
    }

    if (!props.passwordHash.includes(HASH_MARKER)) {
      throw new Error('User passwordHash does not look like a hash');
    }

    return new User(props.id, email, props.passwordHash, props.createdAt ?? new Date());
  }
}
