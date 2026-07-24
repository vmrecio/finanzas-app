import { Argon2PasswordHasher } from './argon2-password-hasher';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('produces an argon2id hash that is different from the plaintext password', async () => {
    const hash = await hasher.hash('correct horse battery staple');

    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('verifies the correct password against its own hash', async () => {
    const hash = await hasher.hash('s3cr3t-password');

    await expect(hasher.verify(hash, 's3cr3t-password')).resolves.toBe(true);
  });

  it('rejects an incorrect password against an existing hash', async () => {
    const hash = await hasher.hash('right-password');

    await expect(hasher.verify(hash, 'wrong-password')).resolves.toBe(false);
  });

  it('produces different hashes for the same password on repeated calls (unique salt)', async () => {
    const first = await hasher.hash('same-password');
    const second = await hasher.hash('same-password');

    expect(first).not.toBe(second);
  });
});
