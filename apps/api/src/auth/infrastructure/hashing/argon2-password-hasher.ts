import * as argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import type { PasswordHasherPort } from '../../application/ports/password-hasher.port';

/**
 * argon2id adapter for PasswordHasherPort. Memory-hard and OWASP-preferred
 * over bcrypt (see design.md "Password hashing"). Salt is generated
 * per-call by the argon2 library itself.
 */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasherPort {
  async hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, { type: argon2.argon2id });
  }

  async verify(hash: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(hash, plainPassword);
  }
}
