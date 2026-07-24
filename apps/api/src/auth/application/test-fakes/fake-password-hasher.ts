import type { PasswordHasherPort } from '../ports/password-hasher.port';

// A fast, deterministic fake so application-layer use case tests do not pay
// argon2's (intentionally expensive) cost. Real hashing is covered by
// Argon2PasswordHasher's own unit tests.
export class FakePasswordHasher implements PasswordHasherPort {
  async hash(plainPassword: string): Promise<string> {
    return `$fake$${plainPassword}`;
  }

  async verify(hash: string, plainPassword: string): Promise<boolean> {
    return hash === `$fake$${plainPassword}`;
  }
}
