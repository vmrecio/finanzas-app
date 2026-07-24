export class DuplicateEmailError extends Error {
  constructor() {
    super('An account with this email already exists');
    this.name = 'DuplicateEmailError';
  }
}

// Deliberately generic: never reveals whether the email or the password was
// wrong (see spec.md "Invalid credentials rejected").
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid or expired refresh token');
    this.name = 'InvalidRefreshTokenError';
  }
}

// A previously-rotated (already-used) refresh token was presented again —
// signals possible token theft. The entire token family is revoked.
export class RefreshTokenReuseError extends Error {
  constructor() {
    super('Refresh token reuse detected');
    this.name = 'RefreshTokenReuseError';
  }
}
