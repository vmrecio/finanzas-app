import { generateRefreshTokenValue, hashRefreshTokenValue } from './refresh-token-crypto';

describe('refresh-token-crypto', () => {
  describe('generateRefreshTokenValue', () => {
    it('returns a non-empty hex string', () => {
      const value = generateRefreshTokenValue();

      expect(value.length).toBeGreaterThan(0);
      expect(/^[0-9a-f]+$/.test(value)).toBe(true);
    });

    it('returns a different value on each call (unpredictable token)', () => {
      const first = generateRefreshTokenValue();
      const second = generateRefreshTokenValue();

      expect(first).not.toBe(second);
    });
  });

  describe('hashRefreshTokenValue', () => {
    it('is deterministic for the same input (same token always hashes the same way)', () => {
      expect(hashRefreshTokenValue('token-abc')).toBe(hashRefreshTokenValue('token-abc'));
    });

    it('produces different hashes for different inputs', () => {
      expect(hashRefreshTokenValue('token-abc')).not.toBe(hashRefreshTokenValue('token-xyz'));
    });

    it('never returns the plaintext token value itself', () => {
      expect(hashRefreshTokenValue('token-abc')).not.toBe('token-abc');
    });
  });
});
