import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DuplicateEmailError } from '../domain/errors';
import { User } from '../domain/user.entity';
import { PASSWORD_HASHER, type PasswordHasherPort } from './ports/password-hasher.port';
import { USER_REPOSITORY, type UserRepositoryPort } from './ports/user-repository.port';

export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterResult {
  id: string;
  email: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterResult> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(normalizedEmail);

    if (existing) {
      throw new DuplicateEmailError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = User.register({ id: randomUUID(), email: normalizedEmail, passwordHash });
    const saved = await this.userRepository.save(user);

    return { id: saved.id, email: saved.email };
  }
}
