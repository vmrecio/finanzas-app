/**
 * Application-layer port for password hashing/verification. The application
 * and domain layers depend only on this interface; the concrete algorithm
 * (argon2id) lives in infrastructure.
 */
export interface PasswordHasherPort {
  hash(plainPassword: string): Promise<string>;
  verify(hash: string, plainPassword: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
